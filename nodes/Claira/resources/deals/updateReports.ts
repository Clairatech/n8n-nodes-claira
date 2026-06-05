import type { INodeProperties } from 'n8n-workflow';

const showOnlyForDealUpdateReports = {
	operation: ['updateReports'],
	resource: ['deals'],
};

export const dealUpdateReportsDescription: INodeProperties[] = [
	{
		displayName: 'Deal ID',
		name: 'dealId',
		type: 'string',
		required: true,
		displayOptions: {
			show: showOnlyForDealUpdateReports,
		},
		default: '',
		description: 'The ID of the deal whose eligible reports should be updated',
	},
];
