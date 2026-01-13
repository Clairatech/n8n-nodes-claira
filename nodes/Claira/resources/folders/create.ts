import type { INodeProperties } from 'n8n-workflow';

const showOnlyForFolderCreate = {
	operation: ['create'],
	resource: ['folders'],
};

export const folderCreateDescription: INodeProperties[] = [
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		displayOptions: {
			show: showOnlyForFolderCreate,
		},
		default: '',
		required: true,
		description: 'Name of the folder',
		routing: {
			send: {
				type: 'body',
				property: 'name',
			},
		},
	},
	{
		displayName: 'Parent ID',
		name: 'parentId',
		type: 'string',
		displayOptions: {
			show: showOnlyForFolderCreate,
		},
		default: '',
		description: 'Optional parent folder ID',
		routing: {
			send: {
				type: 'body',
				property: 'parent_id',
			},
		},
	},
];
