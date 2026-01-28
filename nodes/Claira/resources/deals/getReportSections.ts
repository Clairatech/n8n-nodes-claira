import type { INodeProperties } from 'n8n-workflow';

const showOnlyForDealGetReportSections = {
	operation: ['getReportSections'],
	resource: ['deals'],
};

export const dealGetReportSectionsDescription: INodeProperties[] = [
	{
		displayName: 'Report ID',
		name: 'reportId',
		type: 'string',
		required: true,
		displayOptions: {
			show: showOnlyForDealGetReportSections,
		},
		default: '',
		description: 'The ID of the report (dashboard) to get sections for',
	},
];
