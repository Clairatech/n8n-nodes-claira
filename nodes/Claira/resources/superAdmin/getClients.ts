import type { INodeProperties } from 'n8n-workflow';

const showOnlyForSuperAdminGetClients = {
	operation: ['getClients'],
	resource: ['superAdmin'],
};

export const superAdminGetClientsDescription: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: showOnlyForSuperAdminGetClients,
		},
		default: false,
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		displayOptions: {
			show: {
				...showOnlyForSuperAdminGetClients,
				returnAll: [false],
			},
		},
		default: 50,
		description: 'Max number of results to return',
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		typeOptions: {
			multipleValueButtonText: 'Add Filter',
		},
		displayOptions: {
			show: showOnlyForSuperAdminGetClients,
		},
		default: {},
		options: [
			{
				displayName: 'Client ID',
				name: 'id',
				type: 'string',
				default: '',
				description: 'Filter by exact client ID',
			},
			{
				displayName: 'Client IDs (In)',
				name: 'id.in',
				type: 'string',
				default: '',
				description: 'Filter by list of client IDs (comma-separated)',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Filter by exact client name',
			},
			{
				displayName: 'Name (Case-Insensitive)',
				name: 'name.ilike',
				type: 'string',
				default: '',
				description: 'Filter by client name (partial match, case-insensitive)',
			},
			{
				displayName: 'Name (In)',
				name: 'name.in',
				type: 'string',
				default: '',
				description: 'Filter by list of client names (comma-separated)',
			},
			{
				displayName: 'Name (Like)',
				name: 'name.like',
				type: 'string',
				default: '',
				description: 'Filter by client name (partial match, case-sensitive)',
			},
		],
	},
];
