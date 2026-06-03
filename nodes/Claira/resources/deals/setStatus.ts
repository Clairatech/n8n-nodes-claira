import type { INodeProperties } from 'n8n-workflow';

const showOnlyForDealSetStatus = {
	operation: ['setStatus'],
	resource: ['deals'],
};

export const dealSetStatusDescription: INodeProperties[] = [
	{
		displayName: 'Deal ID',
		name: 'dealId',
		type: 'string',
		displayOptions: {
			show: showOnlyForDealSetStatus,
		},
		default: '',
		required: true,
		description: 'The ID of the deal to update the status for',
	},
	{
		displayName: 'Status',
		name: 'status',
		type: 'string',
		displayOptions: {
			show: showOnlyForDealSetStatus,
		},
		default: '',
		required: true,
		description: 'The new status value to set for the deal',
	},
];
