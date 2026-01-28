import type { INodeProperties } from 'n8n-workflow';
import { dealGetManyDescription } from './getAll';
import { dealGetDescription } from './get';
import { dealCreateDescription } from './create';
import { dealGetStatusDescription } from './getStatus';
import { dealSetStatusDescription } from './setStatus';
import { dealGetStatusOptionsDescription } from './getStatusOptions';
import { dealGetActivitiesDescription } from './getActivities';
import { dealCreateActivityDescription } from './createActivity';
import { dealGetReportsDescription } from './getReports';
import { dealGetReportSectionsDescription } from './getReportSections';

const showOnlyForDeals = {
	resource: ['deals'],
};

const outputFormatOption: INodeProperties = {
	displayName: 'Output Format',
	name: 'outputFormat',
	type: 'options',
	displayOptions: {
		show: showOnlyForDeals,
	},
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
};

export const dealDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForDeals,
		},
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many deals',
				description: 'Get a list of deals',
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a deal',
				description: 'Get a single deal by ID',
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create a deal',
				description: 'Create a new deal',
			},
			{
				name: 'Get Status',
				value: 'getStatus',
				action: 'Get deal status',
				description: 'Get the status of a deal',
			},
			{
				name: 'Set Status',
				value: 'setStatus',
				action: 'Set deal status',
				description: 'Set the status of a deal',
			},
			{
				name: 'Get Status Options',
				value: 'getStatusOptions',
				action: 'Get status options',
				description: 'Get the available status options for deals',
			},
			{
				name: 'Get Activities',
				value: 'getActivities',
				action: 'Get deal activities',
				description: 'Get activities for a deal',
			},
			{
				name: 'Create Activity',
				value: 'createActivity',
				action: 'Create deal activity',
				description: 'Create a new activity for a deal',
			},
			{
				name: 'Get Reports',
				value: 'getReports',
				action: 'Get deal reports',
				description: 'Get all reports (dashboards) for a deal',
			},
			{
				name: 'Get Report Sections',
				value: 'getReportSections',
				action: 'Get report sections',
				description: 'Get all sections for a specific report (dashboard)',
			},
		],
		default: 'getAll',
	},
	outputFormatOption,
	...dealGetManyDescription,
	...dealGetDescription,
	...dealCreateDescription,
	...dealGetStatusDescription,
	...dealSetStatusDescription,
	...dealGetStatusOptionsDescription,
	...dealGetActivitiesDescription,
	...dealCreateActivityDescription,
	...dealGetReportsDescription,
	...dealGetReportSectionsDescription,
];
