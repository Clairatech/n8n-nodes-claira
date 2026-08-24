import { sleep, type IDataObject, type IExecuteFunctions } from 'n8n-workflow';
import { clairaApiRequest } from './transport';

export const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
export const EMAIL_HTML_MIME_TYPE = 'text/html; charset=utf-8';

export type ExportFormat = 'docx' | 'email_html';

const FILE_EXTENSIONS: Record<ExportFormat, string> = {
	docx: 'docx',
	email_html: 'html',
};

/** Section generation operations stop moving once they reach one of these. */
const TERMINAL_OPERATION_STATUSES = ['completed', 'failed', 'stopped'];

export interface ReportReference {
	dashboard_id: string;
	report_title: string | null;
	operation_ids: string[];
}

export function parseOperationIds(raw: unknown): string[] {
	if (Array.isArray(raw)) {
		return raw.map((id) => String(id).trim()).filter((id) => id !== '');
	}

	if (typeof raw !== 'string' || raw.trim() === '') {
		return [];
	}

	const trimmed = raw.trim();
	if (trimmed.startsWith('[')) {
		try {
			return parseOperationIds(JSON.parse(trimmed));
		} catch {
			// Not valid JSON after all - fall through to the comma-separated form
		}
	}

	return trimmed
		.split(',')
		.map((id) => id.trim())
		.filter((id) => id !== '');
}

export function isTerminalOperationStatus(status: unknown): boolean {
	return TERMINAL_OPERATION_STATUSES.includes(String(status || '').toLowerCase());
}

/** Turn a report title into a safe file name for the given format. */
export function buildExportFileName(
	reportTitle: string | null | undefined,
	format: ExportFormat = 'docx',
): string {
	const cleaned = String(reportTitle || 'Report')
		.replace(/[\\/:*?"<>|]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

	return `${cleaned || 'Report'}.${FILE_EXTENSIONS[format]}`;
}

/** Read the file name out of a Content-Disposition header, if it carries one. */
export function fileNameFromContentDisposition(contentDisposition: unknown): string | null {
	const match = String(contentDisposition || '').match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
	if (!match) {
		return null;
	}

	const fileName = decodeURIComponent(match[1]).trim();
	return fileName === '' ? null : fileName;
}

export interface ReportExportParams {
	reportId: string;
	reportTitle: string;
	operationIds: string[];
	formats?: ExportFormat[];
	generationPollingInterval: number;
	generationTimeout: number;
	exportPollingInterval: number;
	exportTimeout: number;
}

/**
 * Wait for a report to finish generating, then export it in every requested format.
 *
 * Never throws on a report that can't be exported: callers feed this straight from
 * a report-generating step that may have produced nothing, and a missing report must
 * not take down the run that was going to send it. ``status`` is 'ready' when at
 * least one format produced output; ``exports`` carries the per-format outcome, so a
 * partial success (HTML rendered, DOCX failed) still sends what landed.
 *
 * An absent or empty ``formats`` falls back to DOCX only, so a node saved before the
 * Formats option existed keeps exporting exactly what it used to.
 */
export async function exportReport(
	this: IExecuteFunctions,
	clientId: string,
	params: ReportExportParams,
): Promise<IDataObject> {
	const result: IDataObject = {
		report_id: params.reportId || null,
		report_title: params.reportTitle || null,
		status: 'skipped',
		file_name: null,
		mime_type: null,
		file_base64: null,
		file_size: 0,
		html_body: null,
		html_size: 0,
		exports: {},
		error: null,
	};

	if (!params.reportId) {
		result.error = 'No report ID provided';
		return result;
	}

	const generation = await waitForSectionOperations.call(
		this,
		clientId,
		params.operationIds,
		params.generationPollingInterval,
		params.generationTimeout,
	);

	if (!generation.finished) {
		result.status = 'generation_timeout';
		result.error = `Report sections were still generating after ${params.generationTimeout / 1000} seconds`;
		result.pending_operation_ids = generation.pending_operation_ids;
		return result;
	}

	const formats: ExportFormat[] = params.formats?.length ? params.formats : ['docx'];
	const exports: IDataObject = {};
	const errors: string[] = [];
	let anyReady = false;

	for (const format of formats) {
		const exportTask = await requestDashboardExport.call(
			this,
			clientId,
			params.reportId,
			format,
			params.exportPollingInterval,
			params.exportTimeout,
		);
		exports[format] = {
			status: exportTask.status,
			export_id: exportTask.export_id,
			error: exportTask.error,
		};

		if (exportTask.status !== 'ready' || !exportTask.export_id) {
			errors.push(`${format}: ${exportTask.error}`);
			continue;
		}

		const download = await downloadDashboardExport.call(
			this,
			clientId,
			params.reportId,
			exportTask.export_id,
			format,
		);
		anyReady = true;

		if (format === 'docx') {
			result.file_name = download.file_name || buildExportFileName(params.reportTitle, 'docx');
			result.mime_type = DOCX_MIME_TYPE;
			result.file_base64 = download.buffer.toString('base64');
			result.file_size = download.buffer.length;
		} else {
			result.html_body = download.buffer.toString('utf8');
			result.html_size = download.buffer.length;
		}
	}

	result.exports = exports;
	result.status = anyReady ? 'ready' : 'export_failed';
	result.error = errors.length > 0 ? errors.join('; ') : null;

	return result;
}

/**
 * Block until every section generation operation has reached a terminal state.
 *
 * The backend has no "report finished" event, so the only way to know a report
 * is complete is to watch the per-section operations it was dispatched with.
 * Operations that can no longer be read are dropped rather than waited on
 * forever - the export below still produces whatever content did land.
 */
export async function waitForSectionOperations(
	this: IExecuteFunctions,
	clientId: string,
	operationIds: string[],
	pollingInterval: number,
	timeout: number,
): Promise<{ finished: boolean; pending_operation_ids: string[] }> {
	const pending = new Set(operationIds);
	const startTime = Date.now();

	while (pending.size > 0) {
		for (const operationId of Array.from(pending)) {
			let status: unknown;
			try {
				const operationResponse = await clairaApiRequest.call(
					this,
					'GET',
					`/credit_analysis/dashboard-sections/operations/${operationId}/`,
					clientId,
				);
				status = unwrapOperationStatus(operationResponse);
			} catch (error) {
				if (this.logger) {
					this.logger.warn(`[Export Report] Could not read operation ${operationId}, no longer waiting for it`, {
						error: error instanceof Error ? error.message : String(error),
					});
				}
				pending.delete(operationId);
				continue;
			}

			if (isTerminalOperationStatus(status)) {
				pending.delete(operationId);
			}
		}

		if (pending.size === 0) {
			break;
		}

		if (Date.now() - startTime >= timeout) {
			return { finished: false, pending_operation_ids: Array.from(pending) };
		}

		if (this.logger) {
			this.logger.debug('[Export Report] Waiting for report sections', {
				pending: pending.size,
				elapsed: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
			});
		}

		await sleep(pollingInterval);
	}

	return { finished: true, pending_operation_ids: [] };
}

function unwrapOperationStatus(operationResponse: IDataObject): unknown {
	const operation = (operationResponse.data as IDataObject) || operationResponse;
	return operation.status;
}

/**
 * Kick off a DOCX export for a report and wait for the file to land in storage.
 *
 * Returns the export id once the file is ready, or the reason it isn't.
 */
export async function requestDashboardExport(
	this: IExecuteFunctions,
	clientId: string,
	dashboardId: string,
	format: ExportFormat,
	pollingInterval: number,
	timeout: number,
): Promise<{ status: 'ready' | 'failed' | 'timeout'; export_id: string | null; error: string | null }> {
	const exportResponse = await clairaApiRequest.call(
		this,
		'POST',
		`/credit_analysis/dashboards/${dashboardId}/export_tasks/`,
		clientId,
		undefined,
		{ format },
	);
	const exportData = (exportResponse.data as IDataObject) || exportResponse;
	const exportId = exportData.export_id as string;

	if (!exportId) {
		return { status: 'failed', export_id: null, error: 'Export task did not return an export ID' };
	}

	const startTime = Date.now();
	while (Date.now() - startTime < timeout) {
		await sleep(pollingInterval);

		const statusResponse = await clairaApiRequest.call(
			this,
			'GET',
			`/credit_analysis/dashboards/${dashboardId}/export_tasks/${exportId}/status/`,
			clientId,
			undefined,
			{ format },
		);
		const statusData = (statusResponse.data as IDataObject) || statusResponse;
		const status = String(statusData.status || '').toLowerCase();

		if (status === 'ready') {
			return { status: 'ready', export_id: exportId, error: null };
		}

		if (status === 'failed') {
			return {
				status: 'failed',
				export_id: exportId,
				error: (statusData.error as string) || 'Export task failed',
			};
		}
	}

	return { status: 'timeout', export_id: exportId, error: `Export was not ready after ${timeout / 1000} seconds` };
}

/** Download a finished export and return its bytes. */
export async function downloadDashboardExport(
	this: IExecuteFunctions,
	clientId: string,
	dashboardId: string,
	exportId: string,
	format: ExportFormat,
): Promise<{ file_name: string | null; buffer: Buffer }> {
	const downloadResponse = (await clairaApiRequest.call(
		this,
		'GET',
		`/credit_analysis/dashboards/${dashboardId}/export_tasks/${exportId}/download/`,
		clientId,
		undefined,
		{ format },
		{ Accept: '*/*' },
		{ encoding: 'arraybuffer', json: false, returnFullResponse: true },
	)) as unknown as { body: Buffer | ArrayBuffer; headers: IDataObject };

	return {
		file_name: fileNameFromContentDisposition((downloadResponse.headers || {})['content-disposition']),
		buffer: Buffer.from(downloadResponse.body as ArrayBuffer),
	};
}
