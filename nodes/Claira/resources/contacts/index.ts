import type { INodeProperties } from 'n8n-workflow';

const showOnlyForContacts = {
	resource: ['contacts'],
};

export const contactDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForContacts,
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a contact',
				description: 'Create a new contact under a firm',
			},
			{
				name: 'Create Activity',
				value: 'createActivity',
				action: 'Log a contact activity',
				description: 'Log an activity for a contact',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Search contacts',
				description: 'Search contacts by email or name',
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a contact',
				description: 'Update an existing contact',
			},
		],
		default: 'getAll',
	},
	// getAll (search) filters
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		placeholder: 'name@email.com',
		default: '',
		description: 'Filter contacts by email (case-insensitive contains)',
		displayOptions: {
			show: { ...showOnlyForContacts, operation: ['getAll'] },
		},
	},
	{
		displayName: 'Full Name',
		name: 'fullName',
		type: 'string',
		default: '',
		description: 'Filter contacts by full name (case-insensitive contains)',
		displayOptions: {
			show: { ...showOnlyForContacts, operation: ['getAll'] },
		},
	},
	// create
	{
		displayName: 'Firm ID',
		name: 'firmId',
		type: 'string',
		default: '',
		description: 'The ID of the firm the contact belongs to',
		displayOptions: {
			show: { ...showOnlyForContacts, operation: ['create', 'update', 'createActivity'] },
		},
	},
	{
		displayName: 'Full Name',
		name: 'contactFullName',
		type: 'string',
		default: '',
		description: 'The full name of the contact',
		displayOptions: {
			show: { ...showOnlyForContacts, operation: ['create'] },
		},
	},
	{
		displayName: 'Email',
		name: 'contactEmail',
		type: 'string',
		placeholder: 'name@email.com',
		default: '',
		description: 'The email of the contact',
		displayOptions: {
			show: { ...showOnlyForContacts, operation: ['create'] },
		},
	},
	// update / activity
	{
		displayName: 'Contact ID',
		name: 'contactId',
		type: 'string',
		default: '',
		description: 'The ID of the contact',
		displayOptions: {
			show: { ...showOnlyForContacts, operation: ['update', 'createActivity'] },
		},
	},
	{
		displayName: 'Note Content',
		name: 'noteContent',
		type: 'string',
		default: '',
		description: 'A note to append to the contact (never overwrites existing notes)',
		displayOptions: {
			show: { ...showOnlyForContacts, operation: ['update'] },
		},
	},
	{
		displayName: 'Title',
		name: 'contactTitle',
		type: 'string',
		default: '',
		description: 'The job title of the contact',
		displayOptions: {
			show: { ...showOnlyForContacts, operation: ['update'] },
		},
	},
	{
		displayName: 'Activity Title',
		name: 'activityTitle',
		type: 'string',
		default: '',
		description: 'The title of the activity',
		displayOptions: {
			show: { ...showOnlyForContacts, operation: ['createActivity'] },
		},
	},
	{
		displayName: 'Activity Description',
		name: 'activityDescription',
		type: 'string',
		default: '',
		description: 'The description of the activity',
		displayOptions: {
			show: { ...showOnlyForContacts, operation: ['createActivity'] },
		},
	},
	{
		displayName: 'Deal ID',
		name: 'dealId',
		type: 'string',
		default: '',
		description: 'The ID of the deal to tag the activity with',
		displayOptions: {
			show: { ...showOnlyForContacts, operation: ['createActivity'] },
		},
	},
];
