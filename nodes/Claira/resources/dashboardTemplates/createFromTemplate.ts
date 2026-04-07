import type { INodeProperties } from 'n8n-workflow';

const showOnlyForDashboardCreateFromTemplate = {
	operation: ['createFromTemplate'],
	resource: ['dashboardTemplates'],
};

export const dashboardCreateFromTemplateDescription: INodeProperties[] = [
	{
		displayName: 'Template ID',
		name: 'templateId',
		type: 'string',
		displayOptions: {
			show: showOnlyForDashboardCreateFromTemplate,
		},
		default: '',
		required: true,
		description: 'The ID of the report agent to use',
	},
	{
		displayName: 'Deal ID',
		name: 'dealId',
		type: 'string',
		displayOptions: {
			show: showOnlyForDashboardCreateFromTemplate,
		},
		default: '',
		required: true,
		description: 'The ID of the deal to create the report for',
	},
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		displayOptions: {
			show: showOnlyForDashboardCreateFromTemplate,
		},
		default: '',
		description: 'Title for the new report (defaults to template title if not provided)',
	},
	{
		displayName: 'Public',
		name: 'public',
		type: 'boolean',
		displayOptions: {
			show: showOnlyForDashboardCreateFromTemplate,
		},
		default: true,
		description: 'Whether the report should be public',
		routing: {
			send: {
				type: 'body',
				property: 'public',
			},
		},
	},
	{
		displayName: 'Is Default',
		name: 'isDefault',
		type: 'boolean',
		displayOptions: {
			show: showOnlyForDashboardCreateFromTemplate,
		},
		default: false,
		description: 'Whether this should be the default report for the deal',
		routing: {
			send: {
				type: 'body',
				property: 'is_default',
			},
		},
	},
];
