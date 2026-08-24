import type { INodeProperties } from 'n8n-workflow';

const showOnlyForDealRunDealSnapshot = {
	operation: ['runDealSnapshot'],
	resource: ['deals'],
};

export const dealRunDealSnapshotDescription: INodeProperties[] = [
	{
		displayName: 'Deal ID',
		name: 'dealId',
		type: 'string',
		required: true,
		displayOptions: {
			show: showOnlyForDealRunDealSnapshot,
		},
		default: '',
		description: 'The ID of the deal whose snapshot report should be created or refreshed',
	},
];
