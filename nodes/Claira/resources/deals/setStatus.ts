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
	{
		displayName: 'Module Version',
		name: 'moduleVersion',
		type: 'string',
		displayOptions: {
			show: showOnlyForDealSetStatus,
		},
		default: 'latest',
		description:
			'The module version to get deal_report_rules from (default: latest). Used to determine if reports should be auto-created when status changes.',
	},
];
