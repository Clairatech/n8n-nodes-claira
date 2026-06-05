import type { IDataObject } from 'n8n-workflow';

export interface ReportUpdateCandidate {
	report: IDataObject;
	skip_reason?: string;
}

export function getReportSkipReason(report: IDataObject): string | undefined {
	if (report.is_reviewed === true) {
		return 'reviewed_report';
	}

	if (!report.id) {
		return 'missing_report_id';
	}

	return undefined;
}

export function partitionReportsForUpdate(reports: IDataObject[]): {
	eligibleReports: IDataObject[];
	skippedReports: ReportUpdateCandidate[];
} {
	const eligibleReports: IDataObject[] = [];
	const skippedReports: ReportUpdateCandidate[] = [];

	for (const report of reports) {
		const skipReason = getReportSkipReason(report);
		if (skipReason) {
			skippedReports.push({
				report,
				skip_reason: skipReason,
			});
			continue;
		}

		eligibleReports.push(report);
	}

	return {
		eligibleReports,
		skippedReports,
	};
}
