import type { INodeProperties } from 'n8n-workflow';

const showOnlyForDealGetReports = {
	operation: ['getReports'],
	resource: ['deals'],
};

export const dealGetReportsDescription: INodeProperties[] = [
	{
		displayName: 'Deal ID',
		name: 'dealId',
		type: 'string',
		required: true,
		displayOptions: {
			show: showOnlyForDealGetReports,
		},
		default: '',
		description: 'The ID of the deal to get reports (dashboards) for',
	},
	{
		displayName: 'Include Sections',
		name: 'includeSections',
		type: 'boolean',
		displayOptions: {
			show: showOnlyForDealGetReports,
		},
		default: false,
		description: 'Whether to include sections for each report',
	},
];
