import type { INodeProperties } from 'n8n-workflow';
import { dashboardTemplateGetManyDescription } from './getAll';
import { dashboardCreateFromTemplateDescription } from './createFromTemplate';

const showOnlyForDashboardTemplates = {
	resource: ['dashboardTemplates'],
};

export const dashboardTemplateDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForDashboardTemplates,
		},
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many dashboard templates',
				description: 'Get a list of many available dashboard templates for the client',
				routing: {
					request: {
						method: 'GET',
						url: '=/credit_analysis/dashboard-templates/',
					},
				},
			},
			{
				name: 'Create Dashboard From Template',
				value: 'createFromTemplate',
				action: 'Create a dashboard from a template',
				description: 'Create a new dashboard using a dashboard template',
				routing: {
					request: {
						method: 'POST',
						url: '=/credit_analysis/dashboards/',
					},
				},
			},
		],
		default: 'getAll',
	},
	...dashboardTemplateGetManyDescription,
	...dashboardCreateFromTemplateDescription,
];
