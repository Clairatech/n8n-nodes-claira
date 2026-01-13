import type {
	IExecuteFunctions,
	IExecuteSingleFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	IDataObject,
} from 'n8n-workflow';
import { ENVIRONMENT_URLS, type IClairaCredentials, type ITokenResponse } from '../types';

export async function getBaseUrls(
	this: IHookFunctions | IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions,
): Promise<{ authUrl: string; docAnalysisUrl: string }> {
	const credentials = (await this.getCredentials('clairaApi')) as IClairaCredentials;

	const environment = credentials.environment || 'platform';
	const envConfig = ENVIRONMENT_URLS[environment];

	return {
		authUrl: credentials.authBaseUrl || envConfig.auth,
		docAnalysisUrl: credentials.docAnalysisBaseUrl || envConfig.docAnalysis,
	};
}

export async function ensureAuthenticated(
	this: IHookFunctions | IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions,
): Promise<string> {
	const credentials = (await this.getCredentials('clairaApi')) as IClairaCredentials;
	const { authUrl } = await getBaseUrls.call(this);

	// Check if we have a valid access token
	if (credentials.accessToken && credentials.tokenExpiry) {
		const now = Date.now();
		// Refresh if token expires in less than 5 minutes
		if (now < credentials.tokenExpiry - 5 * 60 * 1000) {
			return credentials.accessToken;
		}
	}

	// Try to refresh if we have a refresh token
	if (credentials.refreshToken) {
		try {
			const refreshOptions: IHttpRequestOptions = {
				method: 'GET',
				url: `${authUrl}/refresh/`,
				headers: {
					Authorization: `Bearer ${credentials.refreshToken}`,
					Accept: 'application/json',
				},
				json: true,
			};

			const response = (await this.helpers.httpRequest(refreshOptions)) as ITokenResponse;
			const newAccessToken = response.data.access_token;

			// Update credentials if updateCredentials is available (only in IExecuteFunctions)
			if ('updateCredentials' in this && typeof this.updateCredentials === 'function') {
				await this.updateCredentials('clairaApi', {
					...credentials,
					accessToken: newAccessToken,
					tokenExpiry: Date.now() + 60 * 60 * 1000, // Assume 1 hour expiry
				});
			}

			return newAccessToken;
		} catch {
			// Refresh failed, need to login again
		}
	}

	// Login to get new tokens
	const loginOptions: IHttpRequestOptions = {
		method: 'POST',
		url: `${authUrl}/login/`,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
		body: {
			email: credentials.email,
			password: credentials.password,
		},
		json: true,
	};

	const loginResponse = (await this.helpers.httpRequest(loginOptions)) as ITokenResponse;

	const accessToken = loginResponse.data.access_token;
	const refreshToken = loginResponse.data.refresh_token;

	// Update credentials if updateCredentials is available (only in IExecuteFunctions)
	if ('updateCredentials' in this && typeof this.updateCredentials === 'function') {
		await this.updateCredentials('clairaApi', {
			...credentials,
			accessToken,
			refreshToken,
			tokenExpiry: Date.now() + 60 * 60 * 1000, // Assume 1 hour expiry
		});
	}

	return accessToken;
}

export async function clairaApiRequest(
	this: IHookFunctions | IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject,
	qs?: IDataObject,
	headers?: IDataObject,
	options?: Partial<IHttpRequestOptions>,
): Promise<IDataObject> {
	const { docAnalysisUrl } = await getBaseUrls.call(this);
	const accessToken = await ensureAuthenticated.call(this);

	const requestOptions: IHttpRequestOptions = {
		method,
		url: `${docAnalysisUrl}${endpoint}`,
		headers: {
			Authorization: `Bearer ${accessToken}`,
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(headers || {}),
		},
		qs,
		body,
		json: true,
		...options,
	};

	try {
		return await this.helpers.httpRequest(requestOptions);
	} catch (error) {
		// If 401, try to refresh token and retry once
		if (
			error &&
			typeof error === 'object' &&
			'statusCode' in error &&
			error.statusCode === 401
		) {
			// Retry with new token (ensureAuthenticated will handle login if needed)
			const newAccessToken = await ensureAuthenticated.call(this);
			requestOptions.headers = {
				...requestOptions.headers,
				Authorization: `Bearer ${newAccessToken}`,
			};
			return await this.helpers.httpRequest(requestOptions);
		}
		throw error;
	}
}

export async function clairaAuthRequest(
	this: IHookFunctions | IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject,
	qs?: IDataObject,
	headers?: IDataObject,
): Promise<IDataObject> {
	const { authUrl } = await getBaseUrls.call(this);
	const accessToken = await ensureAuthenticated.call(this);

	const requestOptions: IHttpRequestOptions = {
		method,
		url: `${authUrl}${endpoint}`,
		headers: {
			Authorization: `Bearer ${accessToken}`,
			Accept: 'application/json',
			'Content-Type': 'application/json',
			...(headers || {}),
		},
		qs,
		body,
		json: true,
	};

	try {
		return await this.helpers.httpRequest(requestOptions);
	} catch (error) {
		// If 401, try to refresh token and retry once
		if (
			error &&
			typeof error === 'object' &&
			'statusCode' in error &&
			error.statusCode === 401
		) {
			// Retry with new token (ensureAuthenticated will handle login if needed)
			const newAccessToken = await ensureAuthenticated.call(this);
			requestOptions.headers = {
				...requestOptions.headers,
				Authorization: `Bearer ${newAccessToken}`,
			};
			return await this.helpers.httpRequest(requestOptions);
		}
		throw error;
	}
}
