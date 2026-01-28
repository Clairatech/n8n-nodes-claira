import type { INodeProperties } from 'n8n-workflow';
import { superAdminGetClientsDescription } from './getClients';
import { superAdminGetUsersDescription } from './getUsers';

const showOnlyForSuperAdmin = {
	resource: ['superAdmin'],
};

export const superAdminDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForSuperAdmin,
		},
		options: [
			{
				name: 'Get Clients',
				value: 'getClients',
				action: 'Get list of clients',
				description: 'Get the list of all clients (organizations)',
			},
			{
				name: 'Get Users',
				value: 'getUsers',
				action: 'Get list of users',
				description: 'Get the list of users. Filter by client_id to get users for a specific client, or by email to get a user\'s clients.',
			},
		],
		default: 'getClients',
	},
	...superAdminGetClientsDescription,
	...superAdminGetUsersDescription,
];
