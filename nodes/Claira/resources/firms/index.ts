import type { INodeProperties } from 'n8n-workflow';

const showOnlyForFirms = {
	resource: ['firms'],
};

export const firmDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForFirms,
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a firm',
				description: 'Create a new firm',
			},
			{
				name: 'Create Activity',
				value: 'createActivity',
				action: 'Log a firm activity',
				description: 'Log an activity for a firm',
			},
			{
				name: 'Link Deal',
				value: 'linkDeal',
				action: 'Link a firm to a deal',
				description: 'Link a firm to a deal',
			},
			{
				name: 'Resolve',
				value: 'resolve',
				action: 'Resolve a firm by name',
				description: 'Resolve a raw firm name to an existing firm (matched/ambiguous/none)',
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a firm',
				description: 'Update an existing firm',
			},
		],
		default: 'resolve',
	},
	{
		displayName: 'Output Format',
		name: 'outputFormat',
		type: 'options',
		options: [
			{
				name: 'JSON',
				value: 'json',
				description: 'Return raw JSON data',
			},
			{
				name: 'Markdown',
				value: 'markdown',
				description: 'Return formatted markdown text with key information',
			},
		],
		default: 'json',
		description: 'Format of the output data',
		displayOptions: {
			show: { ...showOnlyForFirms, operation: ['resolve'] },
		},
	},
	// resolve
	{
		displayName: 'Firm Name',
		name: 'firmName',
		type: 'string',
		default: '',
		description: 'The raw firm name to resolve against the client firms',
		displayOptions: {
			show: { ...showOnlyForFirms, operation: ['resolve'] },
		},
	},
	// create
	{
		displayName: 'Display Name',
		name: 'displayName',
		type: 'string',
		default: '',
		description: 'The human-readable firm name',
		displayOptions: {
			show: { ...showOnlyForFirms, operation: ['create'] },
		},
	},
	{
		displayName: 'Type',
		name: 'firmType',
		type: 'string',
		default: '',
		description: 'The firm classification (e.g. Sponsor)',
		displayOptions: {
			show: { ...showOnlyForFirms, operation: ['create', 'update'] },
		},
	},
	// update / linkDeal / activity ids
	{
		displayName: 'Firm ID',
		name: 'firmId',
		type: 'string',
		default: '',
		description: 'The ID of the firm',
		displayOptions: {
			show: { ...showOnlyForFirms, operation: ['update', 'linkDeal', 'createActivity'] },
		},
	},
	{
		displayName: 'Update Display Name',
		name: 'updateDisplayName',
		type: 'string',
		default: '',
		description: 'The new display name for the firm',
		displayOptions: {
			show: { ...showOnlyForFirms, operation: ['update'] },
		},
	},
	{
		displayName: 'Deal ID',
		name: 'dealId',
		type: 'string',
		default: '',
		description: 'The ID of the deal',
		displayOptions: {
			show: { ...showOnlyForFirms, operation: ['linkDeal', 'createActivity'] },
		},
	},
	// activity
	{
		displayName: 'Activity Title',
		name: 'activityTitle',
		type: 'string',
		default: '',
		description: 'The title of the activity',
		displayOptions: {
			show: { ...showOnlyForFirms, operation: ['createActivity'] },
		},
	},
	{
		displayName: 'Activity Description',
		name: 'activityDescription',
		type: 'string',
		default: '',
		description: 'The description of the activity',
		displayOptions: {
			show: { ...showOnlyForFirms, operation: ['createActivity'] },
		},
	},
	{
		displayName: 'Contact IDs',
		name: 'contactIds',
		type: 'string',
		default: '',
		description: 'Comma-separated contact IDs to associate with the activity',
		displayOptions: {
			show: { ...showOnlyForFirms, operation: ['createActivity'] },
		},
	},
];
