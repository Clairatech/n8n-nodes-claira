import type { INodeProperties } from 'n8n-workflow';

const showOnlyForDealGetStatus = {
	operation: ['getStatus'],
	resource: ['deals'],
};

export const dealGetStatusDescription: INodeProperties[] = [
	{
		displayName: 'Deal ID',
		name: 'dealId',
		type: 'string',
		displayOptions: {
			show: showOnlyForDealGetStatus,
		},
		default: '',
		required: true,
		description: 'The ID of the deal to retrieve the status for',
	},
];
