import type { INodeProperties } from 'n8n-workflow';

const showOnlyForPipelineAskQuestion = {
	operation: ['askPipelineQuestion'],
	resource: ['deals'],
};

export const dealAskPipelineQuestionDescription: INodeProperties[] = [
	{
		displayName: 'Question',
		name: 'question',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		displayOptions: {
			show: showOnlyForPipelineAskQuestion,
		},
		default: '',
		required: true,
		description: 'The pipeline/aggregate question to ask across all deals',
	},
	{
		displayName: 'Context Options',
		name: 'pipelineContextOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: showOnlyForPipelineAskQuestion,
		},
		options: [
			{
				displayName: 'Use Web Search',
				name: 'useWebSearch',
				type: 'boolean',
				default: false,
				description: 'Whether to allow the pipeline agent to use web search as context for the answer',
			},
			{
				displayName: 'Trusted Domains',
				name: 'trustedDomains',
				type: 'string',
				default: '',
				description: 'Comma-separated list of domains to restrict web search to (only used when web search is enabled)',
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'string',
				default: '',
				description: 'LLM model deployment name to use (leave empty to use the pipeline default model)',
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
			show: showOnlyForPipelineAskQuestion,
		},
		options: [
			{
				displayName: 'Polling Interval (Seconds)',
				name: 'pollingInterval',
				type: 'number',
				default: 3,
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
				default: 540,
				typeOptions: {
					minValue: 30,
					maxValue: 900,
				},
				description: 'Maximum time to wait for the AI response (in seconds). The pipeline agent runs multiple tools and can be slow.',
			},
		],
	},
];
