import type { INodeProperties } from 'n8n-workflow';

const showOnlyForDealGet = {
	operation: ['get'],
	resource: ['deals'],
};

export const dealGetDescription: INodeProperties[] = [
	{
		displayName: 'Deal ID',
		name: 'dealId',
		type: 'string',
		displayOptions: {
			show: showOnlyForDealGet,
		},
		default: '',
		required: true,
		description: 'The ID of the deal to retrieve',
	},
];
