import type { INodeProperties } from 'n8n-workflow';

const showOnlyForDealAskQuestion = {
	operation: ['askQuestion'],
	resource: ['deals'],
};

export const dealAskQuestionDescription: INodeProperties[] = [
	{
		displayName: 'Deal ID',
		name: 'dealId',
		type: 'string',
		displayOptions: {
			show: showOnlyForDealAskQuestion,
		},
		default: '',
		required: true,
		description: 'The ID of the deal to ask a question about',
	},
	{
		displayName: 'Question',
		name: 'question',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		displayOptions: {
			show: showOnlyForDealAskQuestion,
		},
		default: '',
		required: true,
		description: 'The question to ask about the deal',
	},
	{
		displayName: 'Context Options',
		name: 'contextOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: showOnlyForDealAskQuestion,
		},
		options: [
			{
				displayName: 'Use Documents',
				name: 'useDocuments',
				type: 'boolean',
				default: true,
				description: 'Whether to use deal documents as context for the answer',
			},
			{
				displayName: 'Use Spreadsheets',
				name: 'useSpreadsheets',
				type: 'boolean',
				default: true,
				description: 'Whether to use spreadsheet data as context for the answer',
			},
			{
				displayName: 'Use Report Sections',
				name: 'useSections',
				type: 'boolean',
				default: false,
				description: 'Whether to use report sections as context for the answer',
			},
			{
				displayName: 'Use Web Search',
				name: 'useWebSearch',
				type: 'boolean',
				default: false,
				description: 'Whether to use web search as context for the answer',
			},
			{
				displayName: 'Document IDs',
				name: 'documentIds',
				type: 'string',
				default: '',
				description: 'Comma-separated list of specific document IDs to use as context (leave empty to use all)',
			},
			{
				displayName: 'Dashboard IDs',
				name: 'dashboardIds',
				type: 'string',
				default: '',
				description: 'Comma-separated list of specific dashboard IDs to use as context',
			},
			{
				displayName: 'Start Date',
				name: 'startDate',
				type: 'string',
				default: '',
				description: 'Start date filter for context (format: YYYY-MM-DD)',
			},
			{
				displayName: 'End Date',
				name: 'endDate',
				type: 'string',
				default: '',
				description: 'End date filter for context (format: YYYY-MM-DD)',
			},
		],
	},
	{
		displayName: 'Polling Options',
		name: 'pollingOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: showOnlyForDealAskQuestion,
		},
		options: [
			{
				displayName: 'Polling Interval (Seconds)',
				name: 'pollingInterval',
				type: 'number',
				default: 2,
				typeOptions: {
					minValue: 1,
					maxValue: 30,
				},
				description: 'How often to check for the AI response (in seconds)',
			},
			{
				displayName: 'Timeout (Seconds)',
				name: 'timeout',
				type: 'number',
				default: 300,
				typeOptions: {
					minValue: 30,
					maxValue: 600,
				},
				description: 'Maximum time to wait for the AI response (in seconds)',
			},
		],
	},
];
