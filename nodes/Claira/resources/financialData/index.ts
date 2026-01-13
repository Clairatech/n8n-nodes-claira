import type { INodeProperties } from 'n8n-workflow';
import { financialDataGetItemsDescription } from './getItems';
import { financialDataGetTablesDescription } from './getTables';

const showOnlyForFinancialData = {
	resource: ['financialData'],
};

export const financialDataDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForFinancialData,
		},
		options: [
			{
				name: 'Get Items',
				value: 'getItems',
				action: 'Get financial data items',
				description: 'Get financial data items for a document',
				routing: {
					request: {
						method: 'GET',
						url: '=/credit_analysis/docs/{{$parameter.docId}}/fin_data_items/',
					},
				},
			},
			{
				name: 'Get Tables',
				value: 'getTables',
				action: 'Get financial data tables',
				description: 'Get financial data tables for a document',
				routing: {
					request: {
						method: 'GET',
						url: '=/credit_analysis/docs/{{$parameter.docId}}/fin_data_tables/',
					},
				},
			},
		],
		default: 'getItems',
	},
	...financialDataGetItemsDescription,
	...financialDataGetTablesDescription,
];
