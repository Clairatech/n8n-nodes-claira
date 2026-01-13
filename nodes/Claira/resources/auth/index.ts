import type { INodeProperties } from 'n8n-workflow';
import { authGetUserDescription } from './getUser';

const showOnlyForAuth = {
	resource: ['auth'],
};

export const authDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForAuth,
		},
		options: [
			{
				name: 'Get User Info',
				value: 'getUser',
				action: 'Get current user information',
				description: 'Get information about the authenticated user',
				routing: {
					request: {
						method: 'GET',
						url: '=/users/me/',
					},
				},
			},
		],
		default: 'getUser',
	},
	...authGetUserDescription,
];
