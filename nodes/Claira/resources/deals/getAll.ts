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
				...showOnlyForDealGetMany,
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
			},
			{
				displayName: 'Asset Name (Case-Insensitive)',
				name: 'asset_name.ilike',
				type: 'string',
				default: '',
				description: 'Filter by asset name (partial match, case-insensitive)',
			},
			{
				displayName: 'Asset Name (Like)',
				name: 'asset_name.like',
				type: 'string',
				default: '',
				description: 'Filter by asset name (partial match, case-sensitive)',
			},
			{
				displayName: 'Created After',
				name: 'created_at.gt',
				type: 'dateTime',
				default: '',
				description: 'Filter deals created after this date',
			},
			{
				displayName: 'Created Before',
				name: 'created_at.lt',
				type: 'dateTime',
				default: '',
				description: 'Filter deals created before this date',
			},
			{
				displayName: 'Updated After',
				name: 'updated_at.gt',
				type: 'dateTime',
				default: '',
				description: 'Filter deals updated after this date',
			},
		{
		displayName: 'Updated Before',
		name: 'updated_at.lt',
		type: 'dateTime',
		default: '',
		description: 'Filter deals updated before this date',
	},
	],
},
{
	displayName: 'Include Section Contents',
	name: 'includeSectionContents',
	type: 'boolean',
	displayOptions: {
		show: showOnlyForDealGetMany,
	},
	default: false,
	description: 'Whether to include section contents (dashboard fields like Lien, EBITDA, Sector, etc.) for each deal. Dynamically fetches the configured columns from the analyses config.',
},
{
	displayName: 'Include Latest Activities',
	name: 'includeLatestActivities',
	type: 'boolean',
	displayOptions: {
		show: showOnlyForDealGetMany,
	},
	default: false,
	description: 'Whether to include the latest activity for each deal',
},
];
