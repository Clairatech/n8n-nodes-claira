import { sleep, type IDataObject, type IExecuteFunctions } from 'n8n-workflow';
import { clairaApiRequest } from './transport';

export const DOCX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

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

/** Turn a report title into a safe .docx file name. */
export function buildExportFileName(reportTitle: string | null | undefined): string {
	const cleaned = String(reportTitle || 'Report')
		.replace(/[\\/:*?"<>|]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();

	return `${cleaned || 'Report'}.docx`;
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
	generationPollingInterval: number;
	generationTimeout: number;
	exportPollingInterval: number;
	exportTimeout: number;
}

/**
 * Wait for a report to finish generating, export it to DOCX and return the file.
 *
 * Never throws on a report that can't be attached: callers feed this straight
 * from a report-generating step that may have produced nothing, and a missing
 * attachment must not take down the run that was going to send it. The
 * ``status`` field says which stage gave up.
 */
export async function exportReportToDocx(
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

	const exportTask = await requestDashboardExport.call(
		this,
		clientId,
		params.reportId,
		params.exportPollingInterval,
		params.exportTimeout,
	);
	result.export_id = exportTask.export_id;

	if (exportTask.status !== 'ready' || !exportTask.export_id) {
		result.status = exportTask.status === 'timeout' ? 'export_timeout' : 'export_failed';
		result.error = exportTask.error;
		return result;
	}

	const download = await downloadDashboardExport.call(this, clientId, params.reportId, exportTask.export_id);

	result.status = 'ready';
	result.file_name = download.file_name || buildExportFileName(params.reportTitle);
	result.mime_type = DOCX_MIME_TYPE;
	result.file_base64 = download.file_base64;
	result.file_size = download.file_size;

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
	pollingInterval: number,
	timeout: number,
): Promise<{ status: 'ready' | 'failed' | 'timeout'; export_id: string | null; error: string | null }> {
	const exportResponse = await clairaApiRequest.call(
		this,
		'POST',
		`/credit_analysis/dashboards/${dashboardId}/export_tasks/`,
		clientId,
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

/** Download a finished export and return it base64-encoded. */
export async function downloadDashboardExport(
	this: IExecuteFunctions,
	clientId: string,
	dashboardId: string,
	exportId: string,
): Promise<{ file_name: string | null; file_base64: string; file_size: number }> {
	const downloadResponse = (await clairaApiRequest.call(
		this,
		'GET',
		`/credit_analysis/dashboards/${dashboardId}/export_tasks/${exportId}/download/`,
		clientId,
		undefined,
		undefined,
		{ Accept: '*/*' },
		{ encoding: 'arraybuffer', json: false, returnFullResponse: true },
	)) as unknown as { body: Buffer | ArrayBuffer; headers: IDataObject };

	const fileBuffer = Buffer.from(downloadResponse.body as ArrayBuffer);

	return {
		file_name: fileNameFromContentDisposition((downloadResponse.headers || {})['content-disposition']),
		file_base64: fileBuffer.toString('base64'),
		file_size: fileBuffer.length,
	};
}
