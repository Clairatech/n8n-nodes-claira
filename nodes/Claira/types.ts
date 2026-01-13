export interface IClairaCredentials {
	email: string;
	password: string;
	environment: 'platform' | 'stable' | 'dev' | 'local';
	authBaseUrl?: string;
	docAnalysisBaseUrl?: string;
	accessToken?: string;
	refreshToken?: string;
	tokenExpiry?: number;
}

export interface ITokenResponse {
	data: {
		access_token: string;
		refresh_token: string;
	};
}

export interface IUserInfo {
	id: string;
	email: string;
	first_name: string;
	last_name: string;
	current_client_id: string;
	clients: Array<{
		id: string;
		name: string;
	}>;
	groups: Array<{
		id: string;
		name: string;
	}>;
	permissions: string[];
}

export interface IDocument {
	id: string;
	name: string;
	extension: string;
	file_name: string;
	status_id: string;
	created_at: string;
	updated_at: string;
	folder_id?: string;
	deal_id?: string;
	model_type: string;
	financial_types?: Array<{
		id: string;
		name: string;
	}>;
}

export interface IDeal {
	id: string;
	asset_id: string;
	asset_name: string;
	created_at: string;
	updated_at: string;
	fiscal_year_ending?: string;
}

export interface IFolder {
	id: string;
	name: string;
	parent_id?: string;
	children?: IFolder[];
}

export interface IAnalysis {
	id: string;
	doc_id: string;
	created_at: string;
	updated_at: string;
}

export interface IFinancialDataItem {
	id: string;
	item_name: string;
	item_value: string | number;
	table_id: string;
}

export interface IFinancialDataTable {
	id: string;
	table_name: string;
	financial_type_id: string;
	items: IFinancialDataItem[];
}

export interface IApiResponse<T> {
	data: T;
}

export interface IPaginatedResponse<T> {
	data: {
		[key: string]: T[] | number;
		page: number;
		page_size: number;
		count: number;
	};
}

export const ENVIRONMENT_URLS = {
	platform: {
		auth: 'https://auth.platform.claira.io',
		docAnalysis: 'https://da.platform.claira.io/v2',
	},
	stable: {
		auth: 'https://claira-auth.stable.aws.claira.io',
		docAnalysis: 'https://claira-doc-analysis.stable.aws.claira.io/v2',
	},
	dev: {
		auth: 'https://claira-auth.dev.aws.claira.io',
		docAnalysis: 'https://claira-doc-analysis.dev.aws.claira.io/v2',
	},
	local: {
		auth: 'http://localhost:4999',
		docAnalysis: 'http://localhost:4998/v2',
	},
};

export const MODEL_TYPES = [
	'credit_analysis',
	'libor',
	'loan',
	'clo',
	'ftm',
	'cre',
	'lending_manager',
	'mockup',
] as const;

export type ModelType = (typeof MODEL_TYPES)[number];
