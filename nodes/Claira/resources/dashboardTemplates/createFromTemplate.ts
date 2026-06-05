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
];
