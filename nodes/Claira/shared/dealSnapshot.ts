import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { parseOperationIds } from './reportExport';
import { unwrapResponseData } from './templateGeneration';

/**
 * Flatten the deal-snapshot response into the shape the export operation consumes.
 *
 * ``deal_snapshot`` is null whenever there is nothing worth exporting, so the
 * workflow's log-and-continue branch is a single null check. That covers a client
 * with no snapshot template *and* a dashboard that dispatched no work - a
 * regenerate whose sections were all skipped has nothing new to send.
 */
export function normalizeDealSnapshotResponse(
	this: IExecuteFunctions,
	response: IDataObject,
): IDataObject {
	const data = unwrapResponseData(response);
	const dashboard = (data.dashboard as IDataObject) || null;
	const dashboardId = dashboard ? (dashboard.id as string) : null;
	const operationIds = parseOperationIds(data.operation_ids);
	const action = (data.action as string) || 'skipped';
	const skipReason = (data.skip_reason as string) || null;

	if (!dashboardId) {
		if (this.logger) {
			this.logger.warn('[Run Deal Snapshot] No snapshot dashboard for this deal, continuing', {
				action,
				skip_reason: skipReason,
			});
		}
		return { action, skip_reason: skipReason, deal_snapshot: null };
	}

	if (operationIds.length === 0) {
		if (this.logger) {
			this.logger.warn('[Run Deal Snapshot] Snapshot dispatched no work, nothing to export', {
				action,
				dashboard_id: dashboardId,
			});
		}
		return { action, skip_reason: skipReason || 'no_operations', deal_snapshot: null };
	}

	return {
		action,
		skip_reason: skipReason,
		deal_snapshot: {
			dashboard_id: dashboardId,
			report_title: (dashboard.title as string) || null,
			operation_ids: operationIds,
		},
	};
}
