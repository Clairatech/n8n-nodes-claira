import type { INodeProperties } from 'n8n-workflow';

const showOnlyForDocumentDelete = {
	operation: ['delete'],
	resource: ['documents'],
};

export const documentDeleteDescription: INodeProperties[] = [
	{
		displayName: 'Document ID',
		name: 'docId',
		type: 'string',
		displayOptions: {
			show: showOnlyForDocumentDelete,
		},
		default: '',
		required: true,
		description: 'The ID of the document to delete',
	},
];
