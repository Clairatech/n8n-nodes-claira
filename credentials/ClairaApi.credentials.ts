import type {
	IAuthenticateGeneric,
	ICredentialType,
	ICredentialTestRequest,
	INodeProperties,
} from 'n8n-workflow';

export class ClairaApi implements ICredentialType {
	name = 'clairaApi';

	displayName = 'Claira Platform API';

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon = 'file:../icons/claira.svg' as any;

	documentationUrl = 'https://platform.claira.io/v2/documentation/';

	properties: INodeProperties[] = [
		{
			displayName: 'Email',
			name: 'email',
			type: 'string',
			typeOptions: {
				password: false,
			},
			default: '',
			required: true,
			description: 'Your Claira Platform email address',
		},
		{
			displayName: 'Password',
			name: 'password',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Your Claira Platform password',
		},
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'options',
			options: [
				{
					name: 'Platform',
					value: 'platform',
					description: 'Production platform environment',
				},
				{
					name: 'Stable',
					value: 'stable',
					description: 'Stable testing environment',
				},
				{
					name: 'Dev',
					value: 'dev',
					description: 'Development environment',
				},
				{
					name: 'Local',
					value: 'local',
					description: 'Local development environment',
				},
			],
			default: 'platform',
			required: true,
			description: 'Claira Platform environment',
		},
		{
			displayName: 'Auth Base URL',
			name: 'authBaseUrl',
			type: 'string',
			default: '',
			description: 'Override the default auth base URL (optional)',
		},
		{
			displayName: 'Doc Analysis Base URL',
			name: 'docAnalysisBaseUrl',
			type: 'string',
			default: '',
			description: 'Override the default document analysis base URL (optional)',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			method: 'POST',
			url: '={{$credentials.authBaseUrl || ($credentials.environment === "platform" ? "https://auth.platform.claira.io" : $credentials.environment === "stable" ? "https://claira-auth.stable.aws.claira.io" : $credentials.environment === "dev" ? "https://claira-auth.dev.aws.claira.io" : "http://localhost:4999")}}/login/',
			body: {
				email: '={{$credentials.email}}',
				password: '={{$credentials.password}}',
			},
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
	};
}
