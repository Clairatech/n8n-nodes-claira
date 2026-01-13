import {
	NodeConnectionTypes,
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type IHttpRequestOptions,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';
import {
	getBaseUrls,
	ensureAuthenticated,
	clairaApiRequest,
	clairaAuthRequest,
} from './shared/transport';
import { authDescription } from './resources/auth';
import { documentDescription } from './resources/documents';
import { dealDescription } from './resources/deals';
import { folderDescription } from './resources/folders';
import { financialDataDescription } from './resources/financialData';
import { dashboardTemplateDescription } from './resources/dashboardTemplates';

export class Claira implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Claira',
		name: 'claira',
		icon: { light: 'file:../../icons/claira.svg', dark: 'file:../../icons/claira.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Claira Platform API (claira_auth and claira_doc_analysis)',
		defaults: {
			name: 'Claira',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'clairaApi',
				required: true,
			},
		],
		requestDefaults: {
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Auth',
						value: 'auth',
						description: 'Authentication operations',
					},
					{
						name: 'Deal',
						value: 'deals',
						description: 'Deal operations (Credit Analysis)',
					},
					{
						name: 'Document',
						value: 'documents',
						description: 'Document operations',
					},
					{
						name: 'Financial Data',
						value: 'financialData',
						description: 'Financial data operations',
					},
					{
						name: 'Folder',
						value: 'folders',
						description: 'Folder operations',
					},
					{
						name: 'Report Agent',
						value: 'dashboardTemplates',
						description: 'Report Agent operations',
					},
				],
				default: 'documents',
			},
			...authDescription,
			...documentDescription,
			...dealDescription,
			...folderDescription,
			...financialDataDescription,
			...dashboardTemplateDescription,
		],
	};

	async execute(this: IExecuteFunctions) {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: IDataObject | IDataObject[] | undefined;

				if (resource === 'auth') {
					if (operation === 'getUser') {
						responseData = await clairaAuthRequest.call(this, 'GET', '/users/me/');
					}
				} else if (resource === 'documents') {
					if (operation === 'getAll') {
						const modelType = this.getNodeParameter('modelType', i) as string;
						const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
						const qs: IDataObject = { ...filters };

						if (!returnAll) {
							const limit = this.getNodeParameter('limit', i, 50) as number;
							qs.page_size = limit;
							qs.page = 1;
						}

						responseData = await clairaApiRequest.call(
							this,
							'GET',
							`/${modelType}/docs/`,
							undefined,
							qs,
						);

						if (responseData && typeof responseData === 'object' && 'docs' in responseData) {
							responseData = (responseData as IDataObject).docs as IDataObject[];
						}
					} else if (operation === 'get') {
						const modelType = this.getNodeParameter('modelType', i) as string;
						const docId = this.getNodeParameter('docId', i) as string;
						responseData = await clairaApiRequest.call(
							this,
							'GET',
							`/${modelType}/docs/${docId}/`,
						);
					} else if (operation === 'upload') {
						const modelType = this.getNodeParameter('modelType', i) as string;
						const dealId = this.getNodeParameter('dealId', i, '') as string;
						const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i, 'data') as string;
						const folderId = this.getNodeParameter('folderId', i, '') as string;
						const financialTypeIds = this.getNodeParameter('financialTypeIds', i, '') as string;
						const metadata = this.getNodeParameter('metadata', i, '') as string;

						const endpoint = dealId
							? `/credit_analysis/deals/${dealId}/docs/`
							: `/${modelType}/docs/`;

						// Get binary data
						const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
						const dataBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
						const fileName = binaryData.fileName || 'document.pdf';
						const mimeType = binaryData.mimeType || 'application/pdf';

						// Use httpRequest directly for multipart/form-data
						const { docAnalysisUrl } = await getBaseUrls.call(this);
						const accessToken = await ensureAuthenticated.call(this);

						// Build multipart form data - n8n handles multipart automatically when using binary data
						const formData: IDataObject = {
							file: {
								data: dataBuffer,
								filename: fileName,
								contentType: mimeType,
							},
						};

						if (folderId) {
							formData.folder_id = folderId;
						}
						if (financialTypeIds) {
							try {
								const parsedIds =
									typeof financialTypeIds === 'string'
										? JSON.parse(financialTypeIds)
										: financialTypeIds;
								formData.financial_type_ids = parsedIds;
							} catch {
								throw new NodeOperationError(
									this.getNode(),
									'Financial Type IDs must be a valid JSON array. Example: ["uuid1", "uuid2"]',
								);
							}
						}
						if (metadata) {
							try {
								const parsedMetadata =
									typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
								formData.metadata = parsedMetadata;
							} catch {
								throw new NodeOperationError(
									this.getNode(),
									'Metadata must be a valid JSON object',
								);
							}
						}

						const requestOptions: IHttpRequestOptions = {
							method: 'POST',
							url: `${docAnalysisUrl}${endpoint}`,
							headers: {
								Authorization: `Bearer ${accessToken}`,
								Accept: 'application/json',
							},
							body: formData,
						};

						try {
							responseData = await this.helpers.httpRequest(requestOptions);
						} catch (error) {
							// If 401, try to refresh token and retry once
							if (
								error &&
								typeof error === 'object' &&
								'statusCode' in error &&
								error.statusCode === 401
							) {
								const newAccessToken = await ensureAuthenticated.call(this);
								requestOptions.headers = {
									...requestOptions.headers,
									Authorization: `Bearer ${newAccessToken}`,
								};
								responseData = await this.helpers.httpRequest(requestOptions);
							} else {
								throw error;
							}
						}
					} else if (operation === 'delete') {
						const modelType = this.getNodeParameter('modelType', i) as string;
						const docId = this.getNodeParameter('docId', i) as string;
						responseData = await clairaApiRequest.call(
							this,
							'DELETE',
							`/${modelType}/docs/${docId}/`,
						);
					}
				} else if (resource === 'deals') {
					if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i, true) as boolean;
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
						const qs: IDataObject = { ...filters };

						if (!returnAll) {
							const limit = this.getNodeParameter('limit', i, 50) as number;
							qs.page_size = limit;
							qs.page = 1;

							const pageResponse = await clairaApiRequest.call(
								this,
								'GET',
								'/credit_analysis/deals/',
								undefined,
								qs,
							);

							responseData = (pageResponse.deals as IDataObject[]) || [];
						} else {
							// For returnAll, fetch all pages
							qs.page_size = 100;
							qs.page = 1;

							const allDeals: IDataObject[] = [];
							let hasMore = true;
							let currentPage = 1;

							while (hasMore) {
								qs.page = currentPage;
								const pageResponse = await clairaApiRequest.call(
									this,
									'GET',
									'/credit_analysis/deals/',
									undefined,
									qs,
								);

								if (pageResponse.deals && Array.isArray(pageResponse.deals)) {
									allDeals.push(...pageResponse.deals);

									// Check if there are more pages
									const totalCount = (pageResponse.count as number) || 0;
									const pageSize = ((pageResponse.page_size as number) || (qs.page_size as number) || 100) as number;
									const totalPages = Math.ceil(totalCount / pageSize);

									if (currentPage < totalPages) {
										currentPage++;
									} else {
										hasMore = false;
									}
								} else {
									hasMore = false;
								}

								// Safety check to prevent infinite loops
								if (currentPage > 1000) {
									hasMore = false;
								}
							}

							responseData = allDeals;
						}
					} else if (operation === 'get') {
						const dealId = this.getNodeParameter('dealId', i) as string;
						responseData = await clairaApiRequest.call(
							this,
							'GET',
							`/credit_analysis/deals/${dealId}/`,
						);
					} else if (operation === 'create') {
						const assetId = this.getNodeParameter('assetId', i) as string;
						const assetName = this.getNodeParameter('assetName', i) as string;
						const financialTemplateName = this.getNodeParameter(
							'financialTemplateName',
							i,
							'',
						) as string;
						const dealData = this.getNodeParameter('dealData', i, {}) as IDataObject;

						const body: IDataObject = {
							asset_id: assetId,
							asset_name: assetName,
						};

						if (financialTemplateName) {
							body.financial_template = { name: financialTemplateName };
						}
						if (dealData) {
							body.data = typeof dealData === 'string' ? JSON.parse(dealData) : dealData;
						}

						responseData = await clairaApiRequest.call(
							this,
							'POST',
							'/credit_analysis/deals/',
							body,
						);
					}
				} else if (resource === 'folders') {
					if (operation === 'getAll') {
						const modelType = this.getNodeParameter('modelType', i) as string;
						const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
						const qs: IDataObject = {};

						if (!returnAll) {
							const limit = this.getNodeParameter('limit', i, 50) as number;
							qs.page_size = limit;
							qs.page = 1;
						}

						responseData = await clairaApiRequest.call(
							this,
							'GET',
							`/${modelType}/folders/`,
							undefined,
							qs,
						);

						if (responseData && typeof responseData === 'object' && 'folders' in responseData) {
							responseData = (responseData as IDataObject).folders as IDataObject[];
						}
					} else if (operation === 'getTree') {
						const modelType = this.getNodeParameter('modelType', i) as string;
						responseData = await clairaApiRequest.call(
							this,
							'GET',
							`/${modelType}/folders/tree/`,
						);
					} else if (operation === 'create') {
						const modelType = this.getNodeParameter('modelType', i) as string;
						const name = this.getNodeParameter('name', i) as string;
						const parentId = this.getNodeParameter('parentId', i, '') as string;

						const body: IDataObject = {
							name,
						};

						if (parentId) {
							body.parent_id = parentId;
						}

						responseData = await clairaApiRequest.call(
							this,
							'POST',
							`/${modelType}/folders/`,
							body,
						);
					}
				} else if (resource === 'financialData') {
					if (operation === 'getItems') {
						const docId = this.getNodeParameter('docId', i) as string;
						responseData = await clairaApiRequest.call(
							this,
							'GET',
							`/credit_analysis/docs/${docId}/fin_data_items/`,
						);
					} else if (operation === 'getTables') {
						const docId = this.getNodeParameter('docId', i) as string;
						responseData = await clairaApiRequest.call(
							this,
							'GET',
							`/credit_analysis/docs/${docId}/fin_data_tables/`,
						);
					}
				} else if (resource === 'dashboardTemplates') {
					if (operation === 'getAll') {
						responseData = await clairaApiRequest.call(
							this,
							'GET',
							'/credit_analysis/dashboard-templates/',
						);
						if (Array.isArray(responseData)) {
							// responseData is already an array
						} else if (responseData && typeof responseData === 'object' && 'data' in responseData) {
							responseData = (responseData as IDataObject).data as IDataObject[];
						}
					} else if (operation === 'createFromTemplate') {
						const templateId = this.getNodeParameter('templateId', i) as string;
						const dealId = this.getNodeParameter('dealId', i) as string;
						const title = this.getNodeParameter('title', i, '') as string;
						const public_ = this.getNodeParameter('public', i, true) as boolean;
						const isDefault = this.getNodeParameter('isDefault', i, false) as boolean;

						// First, get all templates and find the one we need
						const templates = await clairaApiRequest.call(
							this,
							'GET',
							'/credit_analysis/dashboard-templates/',
						);
						
						const templatesList: IDataObject[] = Array.isArray(templates)
							? (templates as IDataObject[])
							: ((templates as IDataObject).data as IDataObject[]) || [];
						const template = templatesList.find(
							(t: IDataObject) => t.id === templateId,
						) as IDataObject | undefined;

						if (!template) {
							throw new NodeOperationError(
								this.getNode(),
								`Report Agent with ID ${templateId} not found`,
								{ itemIndex: i },
							);
						}

						// Create report from report agent
						const dashboardBody: IDataObject = {
							deal_id: dealId,
							title: title || template.title || 'Report',
							public: public_,
							is_default: isDefault,
						};

						responseData = await clairaApiRequest.call(
							this,
							'POST',
							'/credit_analysis/dashboards/',
							dashboardBody,
						);
					}
				}

				if (responseData !== undefined) {
					if (Array.isArray(responseData)) {
						returnData.push(...responseData);
					} else {
						returnData.push(responseData);
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					const errorMessage = error instanceof Error ? error.message : String(error);
					returnData.push({ error: errorMessage });
					continue;
				}
				throw error;
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}
