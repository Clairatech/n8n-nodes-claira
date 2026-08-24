import type { INodeProperties } from 'n8n-workflow';

const showOnlyForDealExportReport = {
	operation: ['exportReport'],
	resource: ['deals'],
};

export const dealExportReportDescription: INodeProperties[] = [
	{
		displayName: 'Report ID',
		name: 'reportId',
		type: 'string',
		displayOptions: {
			show: showOnlyForDealExportReport,
		},
		default: '',
		description:
			'The ID of the report (dashboard) to export. Leave empty to skip the export - the operation then returns status "skipped" instead of failing, so it can be fed straight from an expression that may not resolve to a report.',
	},
	{
		displayName: 'Report Title',
		name: 'reportTitle',
		type: 'string',
		displayOptions: {
			show: showOnlyForDealExportReport,
		},
		default: '',
		description: 'Title of the report, used to name the exported file. Falls back to the report title from the API.',
	},
	{
		displayName: 'Operation IDs',
		name: 'operationIds',
		type: 'string',
		displayOptions: {
			show: showOnlyForDealExportReport,
		},
		default: '',
		description:
			'Section generation operation IDs to wait for before exporting, as a comma-separated list or a JSON array. Pass the operation_ids returned when the report was created or regenerated.',
	},
	{
		displayName: 'Formats',
		name: 'formats',
		type: 'multiOptions',
		displayOptions: {
			show: showOnlyForDealExportReport,
		},
		options: [
			{
				name: 'DOCX',
				value: 'docx',
				description: 'A Word document, suitable for an email attachment',
			},
			{
				name: 'Email HTML',
				value: 'email_html',
				description: 'An email-safe HTML fragment, suitable for the body of a reply',
			},
		],
		default: ['docx'],
		description: 'Which formats to export. Each requested format is returned on the same item.',
	},
	{
		displayName: 'Export Options',
		name: 'exportOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: showOnlyForDealExportReport,
		},
		options: [
			{
				displayName: 'Export Polling Interval (Seconds)',
				name: 'exportPollingInterval',
				type: 'number',
				default: 3,
				typeOptions: {
					minValue: 1,
					maxValue: 60,
				},
				description: 'How often to check whether the export is ready',
			},
			{
				displayName: 'Export Timeout (Seconds)',
				name: 'exportTimeout',
				type: 'number',
				default: 180,
				typeOptions: {
					minValue: 30,
					maxValue: 900,
				},
				description: 'Maximum time to wait for the export to be produced',
			},
			{
				displayName: 'Generation Polling Interval (Seconds)',
				name: 'generationPollingInterval',
				type: 'number',
				default: 10,
				typeOptions: {
					minValue: 1,
					maxValue: 120,
				},
				description: 'How often to check whether the report sections have finished generating',
			},
			{
				displayName: 'Generation Timeout (Seconds)',
				name: 'generationTimeout',
				type: 'number',
				default: 900,
				typeOptions: {
					minValue: 30,
					maxValue: 3600,
				},
				description: 'Maximum time to wait for all report sections to finish generating',
			},
		],
	},
];
