import type { INodeProperties } from 'n8n-workflow';
import { dealGetManyDescription } from './getAll';
import { dealGetDescription } from './get';
import { dealCreateDescription } from './create';

const showOnlyForDeals = {
	resource: ['deals'],
};

export const dealDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForDeals,
		},
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many deals',
				description: 'Get a list of deals',
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a deal',
				description: 'Get a single deal by ID',
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create a deal',
				description: 'Create a new deal',
			},
		],
		default: 'getAll',
	},
	...dealGetManyDescription,
	...dealGetDescription,
	...dealCreateDescription,
];
