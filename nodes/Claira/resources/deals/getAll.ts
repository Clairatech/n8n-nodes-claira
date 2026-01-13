import type { INodeProperties } from 'n8n-workflow';

const showOnlyForDealGetMany = {
	operation: ['getAll'],
	resource: ['deals'],
};

export const dealGetManyDescription: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: showOnlyForDealGetMany,
		},
		default: true,
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
				...showOnlyForDealGetMany,
				returnAll: [false],
			},
		},
		default: 50,
		description: 'Max number of results to return',
		routing: {
			send: {
				type: 'query',
				property: 'page_size',
			},
		},
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		typeOptions: {
			multipleValueButtonText: 'Add Filter',
		},
		displayOptions: {
			show: showOnlyForDealGetMany,
		},
		default: {},
		options: [
			{
				displayName: 'Asset ID',
				name: 'asset_id',
				type: 'string',
				default: '',
				description: 'Filter by asset ID',
				routing: {
					send: {
						type: 'query',
						property: 'asset_id',
					},
				},
			},
			{
				displayName: 'Asset Name (Case-Insensitive)',
				name: 'asset_name.ilike',
				type: 'string',
				default: '',
				description: 'Filter by asset name (partial match, case-insensitive)',
				routing: {
					send: {
						type: 'query',
						property: 'asset_name.ilike',
					},
				},
			},
			{
				displayName: 'Asset Name (Like)',
				name: 'asset_name.like',
				type: 'string',
				default: '',
				description: 'Filter by asset name (partial match, case-sensitive)',
				routing: {
					send: {
						type: 'query',
						property: 'asset_name.like',
					},
				},
			},
			{
				displayName: 'Created After',
				name: 'created_at.gt',
				type: 'dateTime',
				default: '',
				description: 'Filter deals created after this date',
				routing: {
					send: {
						type: 'query',
						property: 'created_at.gt',
					},
				},
			},
			{
				displayName: 'Created Before',
				name: 'created_at.lt',
				type: 'dateTime',
				default: '',
				description: 'Filter deals created before this date',
				routing: {
					send: {
						type: 'query',
						property: 'created_at.lt',
					},
				},
			},
			{
				displayName: 'Updated After',
				name: 'updated_at.gt',
				type: 'dateTime',
				default: '',
				description: 'Filter deals updated after this date',
				routing: {
					send: {
						type: 'query',
						property: 'updated_at.gt',
					},
				},
			},
			{
				displayName: 'Updated Before',
				name: 'updated_at.lt',
				type: 'dateTime',
				default: '',
				description: 'Filter deals updated before this date',
				routing: {
					send: {
						type: 'query',
						property: 'updated_at.lt',
					},
				},
			},
		],
	},
];
