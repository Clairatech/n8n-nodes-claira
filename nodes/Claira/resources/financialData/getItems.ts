import type { INodeProperties } from 'n8n-workflow';

const showOnlyForFinancialDataGetItems = {
	operation: ['getItems'],
	resource: ['financialData'],
};

export const financialDataGetItemsDescription: INodeProperties[] = [
	{
		displayName: 'Document ID',
		name: 'docId',
		type: 'string',
		displayOptions: {
			show: showOnlyForFinancialDataGetItems,
		},
		default: '',
		required: true,
		description: 'The ID of the document to get financial data items for',
	},
];
