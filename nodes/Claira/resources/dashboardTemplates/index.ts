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
				action: 'Get many report agents',
				description: 'Get a list of many available report agents for the client',
				routing: {
					request: {
						method: 'GET',
						url: '=/credit_analysis/dashboard-templates/',
					},
				},
			},
			{
				name: 'Create Report From Report Agent',
				value: 'createFromTemplate',
				action: 'Create a report from a report agent',
				description: 'Create a new report using a report agent',
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
