import type { INodeProperties } from 'n8n-workflow';

const showOnlyForDocumentUpload = {
	operation: ['upload'],
	resource: ['documents'],
};

export const documentUploadDescription: INodeProperties[] = [
	{
		displayName: 'Binary Property',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		displayOptions: {
			show: showOnlyForDocumentUpload,
		},
		required: true,
		description: 'Name of the binary property that contains the file to upload',
	},
	{
		displayName: 'Deal ID',
		name: 'dealId',
		type: 'string',
		displayOptions: {
			show: {
				...showOnlyForDocumentUpload,
				modelType: ['credit_analysis'],
			},
		},
		default: '',
		description:
			'Deal ID for credit analysis documents (required for credit_analysis). When uploading a .zip file with a Deal ID set, the zip is sent to the bulk endpoint and each file inside is created as a separate document.',
	},
	{
		displayName: 'Folder ID',
		name: 'folderId',
		type: 'string',
		displayOptions: {
			show: showOnlyForDocumentUpload,
		},
		default: '',
		description: 'Optional folder ID to upload the document to',
		routing: {
			send: {
				type: 'body',
				property: 'folder_id',
			},
		},
	},
	{
		displayName: 'Financial Type IDs',
		name: 'financialTypeIds',
		type: 'string',
		displayOptions: {
			show: {
				...showOnlyForDocumentUpload,
				modelType: ['credit_analysis'],
			},
		},
		default: '',
		description: 'JSON array of financial type IDs (for credit analysis)',
		routing: {
			send: {
				type: 'body',
				property: 'financial_type_ids',
			},
		},
	},
	{
		displayName: 'Metadata',
		name: 'metadata',
		type: 'json',
		displayOptions: {
			show: showOnlyForDocumentUpload,
		},
		default: '',
		description: 'Optional metadata as JSON object',
		routing: {
			send: {
				type: 'body',
				property: 'metadata',
			},
		},
	},
];
