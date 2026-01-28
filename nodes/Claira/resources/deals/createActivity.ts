import type { INodeProperties } from 'n8n-workflow';

const showOnlyForDealCreateActivity = {
	operation: ['createActivity'],
	resource: ['deals'],
};

export const dealCreateActivityDescription: INodeProperties[] = [
	{
		displayName: 'Deal ID',
		name: 'dealId',
		type: 'string',
		displayOptions: {
			show: showOnlyForDealCreateActivity,
		},
		default: '',
		required: true,
		description: 'The ID of the deal to create an activity for',
	},
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		displayOptions: {
			show: showOnlyForDealCreateActivity,
		},
		default: '',
		required: true,
		description: 'The title of the activity (max 500 characters)',
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		displayOptions: {
			show: showOnlyForDealCreateActivity,
		},
		default: '',
		description: 'The description of the activity (max 2000 characters)',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: showOnlyForDealCreateActivity,
		},
		options: [
			{
				displayName: 'Document IDs',
				name: 'docIds',
				type: 'string',
				default: '',
				description: 'Comma-separated list of document IDs to link to this activity',
			},
			{
				displayName: 'Dashboard IDs',
				name: 'dashboardIds',
				type: 'string',
				default: '',
				description: 'Comma-separated list of dashboard IDs to link to this activity',
			},
			{
				displayName: 'Section IDs',
				name: 'sectionIds',
				type: 'string',
				default: '',
				description: 'Comma-separated list of dashboard section IDs to link to this activity',
			},
			{
				displayName: 'Data (JSON)',
				name: 'data',
				type: 'json',
				default: '{}',
				description: 'Additional data to store with the activity as JSON',
			},
		],
	},
];
