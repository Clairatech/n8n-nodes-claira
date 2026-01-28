import type { INodeProperties } from 'n8n-workflow';

const showOnlyForDealGetStatusOptions = {
	operation: ['getStatusOptions'],
	resource: ['deals'],
};

export const dealGetStatusOptionsDescription: INodeProperties[] = [
	{
		displayName: 'Module Version',
		name: 'moduleVersion',
		type: 'string',
		displayOptions: {
			show: showOnlyForDealGetStatusOptions,
		},
		default: 'latest',
		description: 'The module version to get status options from (default: latest)',
	},
];
