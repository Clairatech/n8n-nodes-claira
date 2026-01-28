import type { INodeProperties } from 'n8n-workflow';

const showOnlyForDealGetActivities = {
	operation: ['getActivities'],
	resource: ['deals'],
};

export const dealGetActivitiesDescription: INodeProperties[] = [
	{
		displayName: 'Scope',
		name: 'activityScope',
		type: 'options',
		displayOptions: {
			show: showOnlyForDealGetActivities,
		},
		options: [
			{
				name: 'All Deals',
				value: 'all',
				description: 'Get activities across all deals',
			},
			{
				name: 'Specific Deal',
				value: 'deal',
				description: 'Get activities for a specific deal',
			},
		],
		default: 'deal',
		description: 'Whether to get activities for all deals or a specific deal',
	},
	{
		displayName: 'Deal ID',
		name: 'dealId',
		type: 'string',
		displayOptions: {
			show: {
				...showOnlyForDealGetActivities,
				activityScope: ['deal'],
			},
		},
		default: '',
		required: true,
		description: 'The ID of the deal to get activities for',
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: showOnlyForDealGetActivities,
		},
		default: false,
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: {
			show: {
				...showOnlyForDealGetActivities,
				returnAll: [false],
			},
		},
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		default: 50,
		description: 'Max number of results to return',
	},
];
