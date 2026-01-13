import type { INodeProperties } from 'n8n-workflow';
import { documentGetManyDescription } from './getAll';
import { documentGetDescription } from './get';
import { documentUploadDescription } from './upload';
import { documentDeleteDescription } from './delete';

const showOnlyForDocuments = {
	resource: ['documents'],
};

export const documentDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForDocuments,
		},
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many documents',
				description: 'Get a list of documents',
				routing: {
					request: {
						method: 'GET',
						url: '=/{{$parameter.modelType}}/docs/',
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a document',
				description: 'Get a single document by ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/{{$parameter.modelType}}/docs/{{$parameter.docId}}/',
					},
				},
			},
			{
				name: 'Upload',
				value: 'upload',
				action: 'Upload a document',
				description: 'Upload a new document',
				routing: {
					request: {
						method: 'POST',
						url: '={{$parameter.dealId ? `/credit_analysis/deals/${$parameter.dealId}/docs/` : `/${$parameter.modelType}/docs/`}}',
					},
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a document',
				description: 'Delete a document by ID',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/{{$parameter.modelType}}/docs/{{$parameter.docId}}/',
					},
				},
			},
		],
		default: 'getAll',
	},
	{
		displayName: 'Model Type',
		name: 'modelType',
		type: 'options',
		options: [
			{ name: 'CLO', value: 'clo' },
			{ name: 'CRE', value: 'cre' },
			{ name: 'Credit Analysis', value: 'credit_analysis' },
			{ name: 'FTM', value: 'ftm' },
			{ name: 'Lending Manager', value: 'lending_manager' },
			{ name: 'LIBOR', value: 'libor' },
			{ name: 'Loan', value: 'loan' },
			{ name: 'Mockup', value: 'mockup' },
		],
		default: 'credit_analysis',
		displayOptions: {
			show: showOnlyForDocuments,
		},
		required: true,
		description: 'The model type for the document',
	},
	...documentGetManyDescription,
	...documentGetDescription,
	...documentUploadDescription,
	...documentDeleteDescription,
];
