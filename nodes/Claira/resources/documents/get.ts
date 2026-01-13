import type { INodeProperties } from 'n8n-workflow';

const showOnlyForDocumentGet = {
	operation: ['get'],
	resource: ['documents'],
};

export const documentGetDescription: INodeProperties[] = [
	{
		displayName: 'Document ID',
		name: 'docId',
		type: 'string',
		displayOptions: {
			show: showOnlyForDocumentGet,
		},
		default: '',
		required: true,
		description: 'The ID of the document to retrieve',
	},
];
