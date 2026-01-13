import type { INodeProperties } from 'n8n-workflow';

const showOnlyForDealCreate = {
	operation: ['create'],
	resource: ['deals'],
};

export const dealCreateDescription: INodeProperties[] = [
	{
		displayName: 'Asset ID',
		name: 'assetId',
		type: 'string',
		displayOptions: {
			show: showOnlyForDealCreate,
		},
		default: '',
		required: true,
		description: 'Unique identifier for the asset',
		routing: {
			send: {
				type: 'body',
				property: 'asset_id',
			},
		},
	},
	{
		displayName: 'Asset Name',
		name: 'assetName',
		type: 'string',
		displayOptions: {
			show: showOnlyForDealCreate,
		},
		default: '',
		required: true,
		description: 'Name of the asset',
		routing: {
			send: {
				type: 'body',
				property: 'asset_name',
			},
		},
	},
	{
		displayName: 'Financial Template Name',
		name: 'financialTemplateName',
		type: 'string',
		displayOptions: {
			show: showOnlyForDealCreate,
		},
		default: '',
		description: 'Name of the financial template to use',
		routing: {
			send: {
				type: 'body',
				property: 'financial_template.name',
			},
		},
	},
	{
		displayName: 'Deal Data',
		name: 'dealData',
		type: 'json',
		displayOptions: {
			show: showOnlyForDealCreate,
		},
		default: '',
		description: 'Additional deal data (fiscal_year_ending, etc.) as JSON object',
		routing: {
			send: {
				type: 'body',
				property: 'data',
			},
		},
	},
];
