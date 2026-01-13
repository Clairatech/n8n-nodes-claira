import type { INodeProperties } from 'n8n-workflow';

const showOnlyForDocumentGetMany = {
	operation: ['getAll'],
	resource: ['documents'],
};

export const documentGetManyDescription: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: showOnlyForDocumentGetMany,
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
				...showOnlyForDocumentGetMany,
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
			show: showOnlyForDocumentGetMany,
		},
		default: {},
		options: [
			{
				displayName: 'Created After',
				name: 'created_at.gt',
				type: 'dateTime',
				default: '',
				description: 'Filter documents created after this date',
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
				description: 'Filter documents created before this date',
				routing: {
					send: {
						type: 'query',
						property: 'created_at.lt',
					},
				},
			},
			{
				displayName: 'Deal ID',
				name: 'deal_id',
				type: 'string',
				default: '',
				description: 'Filter by deal ID',
				routing: {
					send: {
						type: 'query',
						property: 'deal_id',
					},
				},
			},
			{
				displayName: 'Folder ID',
				name: 'folder_id',
				type: 'string',
				default: '',
				description: 'Filter by folder ID',
				routing: {
					send: {
						type: 'query',
						property: 'folder_id',
					},
				},
			},
			{
				displayName: 'Name (Like)',
				name: 'name.like',
				type: 'string',
				default: '',
				description: 'Filter by document name (partial match, case-sensitive)',
				routing: {
					send: {
						type: 'query',
						property: 'name.like',
					},
				},
			},
			{
				displayName: 'Status ID',
				name: 'status_id',
				type: 'string',
				default: '',
				description: 'Filter by document status ID',
				routing: {
					send: {
						type: 'query',
						property: 'status_id',
					},
				},
			},
		],
	},
];
