import type { INodeProperties } from 'n8n-workflow';

const showOnlyForFinancialDataGetTables = {
	operation: ['getTables'],
	resource: ['financialData'],
};

export const financialDataGetTablesDescription: INodeProperties[] = [
	{
		displayName: 'Document ID',
		name: 'docId',
		type: 'string',
		displayOptions: {
			show: showOnlyForFinancialDataGetTables,
		},
		default: '',
		required: true,
		description: 'The ID of the document to get financial data tables for',
	},
];
