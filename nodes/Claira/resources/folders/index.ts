import type { INodeProperties } from 'n8n-workflow';
import { folderGetManyDescription } from './getAll';
import { folderGetTreeDescription } from './getTree';
import { folderCreateDescription } from './create';

const showOnlyForFolders = {
	resource: ['folders'],
};

export const folderDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForFolders,
		},
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many folders',
				description: 'Get a list of folders',
				routing: {
					request: {
						method: 'GET',
						url: '=/{{$parameter.modelType}}/folders/',
					},
				},
			},
			{
				name: 'Get Tree',
				value: 'getTree',
				action: 'Get folder tree',
				description: 'Get the folder tree structure',
				routing: {
					request: {
						method: 'GET',
						url: '=/{{$parameter.modelType}}/folders/tree/',
					},
				},
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create a folder',
				description: 'Create a new folder',
				routing: {
					request: {
						method: 'POST',
						url: '=/{{$parameter.modelType}}/folders/',
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
			show: showOnlyForFolders,
		},
		required: true,
		description: 'The model type for the folder',
	},
	...folderGetManyDescription,
	...folderGetTreeDescription,
	...folderCreateDescription,
];
