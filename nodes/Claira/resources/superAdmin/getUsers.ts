import type { INodeProperties } from 'n8n-workflow';

const showOnlyForSuperAdminGetUsers = {
	operation: ['getUsers'],
	resource: ['superAdmin'],
};

export const superAdminGetUsersDescription: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: showOnlyForSuperAdminGetUsers,
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
				...showOnlyForSuperAdminGetUsers,
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
			show: showOnlyForSuperAdminGetUsers,
		},
		default: {},
		options: [
			{
				displayName: 'User ID',
				name: 'id',
				type: 'string',
				default: '',
				description: 'Filter by exact user ID',
			},
			{
				displayName: 'User IDs (In)',
				name: 'id.in',
				type: 'string',
				default: '',
				description: 'Filter by list of user IDs (comma-separated)',
			},
			{
				displayName: 'Client ID',
				name: 'client_id',
				type: 'string',
				default: '',
				description: 'Filter by single client ID to get users for that client',
			},
			{
				displayName: 'Client IDs (In)',
				name: 'client_id.in',
				type: 'string',
				default: '',
				description: 'Filter by list of client IDs (comma-separated)',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				default: '',
				description: 'Filter by exact user email',
			},
			{
				displayName: 'Email (Case-Insensitive)',
				name: 'email.ilike',
				type: 'string',
				default: '',
				description: 'Filter by user email (partial match, case-insensitive)',
			},
			{
				displayName: 'Email (Like)',
				name: 'email.like',
				type: 'string',
				default: '',
				description: 'Filter by user email (partial match, case-sensitive)',
			},
			{
				displayName: 'First Name',
				name: 'first_name',
				type: 'string',
				default: '',
				description: 'Filter by exact first name',
			},
			{
				displayName: 'First Name (Case-Insensitive)',
				name: 'first_name.ilike',
				type: 'string',
				default: '',
				description: 'Filter by first name (partial match, case-insensitive)',
			},
			{
				displayName: 'Last Name',
				name: 'last_name',
				type: 'string',
				default: '',
				description: 'Filter by exact last name',
			},
			{
				displayName: 'Last Name (Case-Insensitive)',
				name: 'last_name.ilike',
				type: 'string',
				default: '',
				description: 'Filter by last name (partial match, case-insensitive)',
			},
			{
				displayName: 'Is External',
				name: 'is_external',
				type: 'boolean',
				default: false,
				description: 'Whether to filter by external users only',
			},
			{
				displayName: 'Created After',
				name: 'created_at.gt',
				type: 'dateTime',
				default: '',
				description: 'Filter users created after this date',
			},
			{
				displayName: 'Created Before',
				name: 'created_at.lt',
				type: 'dateTime',
				default: '',
				description: 'Filter users created before this date',
			},
		],
	},
];
