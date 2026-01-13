import {
	NodeConnectionTypes,
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type IHttpRequestOptions,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';
import FormData from 'form-data';
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
						let binaryPropertyName = this.getNodeParameter('binaryPropertyName', i, 'data') as string;
						const folderId = this.getNodeParameter('folderId', i, '') as string;
						const financialTypeIds = this.getNodeParameter('financialTypeIds', i, '') as string;
						const metadata = this.getNodeParameter('metadata', i, '') as string;

						// Ensure binary property name is set
						if (!binaryPropertyName || binaryPropertyName.trim() === '') {
							binaryPropertyName = 'data';
						}

						const endpoint = dealId
							? `/credit_analysis/deals/${dealId}/docs/`
							: `/${modelType}/docs/`;

						// Verify binary data exists
						const item = items[i];
						if (!item.binary || !item.binary[binaryPropertyName]) {
							const availableBinaryProperties = item.binary ? Object.keys(item.binary).join(', ') : 'none';
							throw new NodeOperationError(
								this.getNode(),
								`No binary data found with property name "${binaryPropertyName}". Make sure the previous node outputs binary data, or specify the correct binary property name. Available binary properties: ${availableBinaryProperties}`,
								{ itemIndex: i },
							);
						}

						// Verify binary data is accessible
						try {
							this.helpers.assertBinaryData(i, binaryPropertyName);
						} catch (error) {
							const availableBinaryProperties = item.binary ? Object.keys(item.binary).join(', ') : 'none';
							throw new NodeOperationError(
								this.getNode(),
								`Cannot access binary data with property name "${binaryPropertyName}". Available binary properties: ${availableBinaryProperties}`,
								{ itemIndex: i },
							);
						}

					// Use httpRequest directly for multipart/form-data
					const { docAnalysisUrl } = await getBaseUrls.call(this);
					const accessToken = await ensureAuthenticated.call(this);

					// Get binary data buffer and metadata
					const binaryData = item.binary[binaryPropertyName];
					const binaryBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
					
					// Build multipart form data using FormData (equivalent to setting parameter type = "n8n binary file" in HTTP Request node UI)
					const formData = new FormData();
					formData.append('file', binaryBuffer, {
						filename: binaryData.fileName || 'file',
						contentType: binaryData.mimeType || 'application/octet-stream',
					});

					// Add other fields
					if (folderId) {
						formData.append('folder_id', folderId);
					}
					if (financialTypeIds) {
						try {
							const parsedIds =
								typeof financialTypeIds === 'string'
									? JSON.parse(financialTypeIds)
									: financialTypeIds;
							formData.append('financial_type_ids', JSON.stringify(parsedIds));
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
							formData.append('metadata', JSON.stringify(parsedMetadata));
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
							// Don't set Content-Type - FormData will set it to multipart/form-data with boundary
							...formData.getHeaders(),
						},
						body: formData,
						// Explicitly don't use JSON encoding since we're sending multipart/form-data
						json: false,
					};

					// Log request details for debugging
					if (this.logger) {
						this.logger.debug('Upload request', {
							url: `${docAnalysisUrl}${endpoint}`,
							hasFile: true,
							fileName: binaryData.fileName,
							mimeType: binaryData.mimeType,
							hasFolderId: !!folderId,
							hasFinancialTypeIds: !!financialTypeIds,
							hasMetadata: !!metadata,
						});
					}

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
								// Extract error details from axios error response
								const axiosError = error as any;
								const statusCode = axiosError.response?.status || axiosError.statusCode || axiosError.code;
								const errorResponse = axiosError.response?.data;
								
								// Try to extract Flask error message (Flask can return errors in various formats)
								let errorMessage = 'Unknown error';
								if (errorResponse) {
									// Try different common Flask error formats
									errorMessage =
										errorResponse.message ||
										errorResponse.error ||
										errorResponse.detail ||
										errorResponse.description ||
										errorResponse.msg ||
										errorResponse.file?.[0] || // Field-specific errors
										errorResponse.file || // Direct field error
										(typeof errorResponse === 'string' ? errorResponse : null) ||
										JSON.stringify(errorResponse);
								} else if (axiosError.message) {
									errorMessage = axiosError.message;
								}
								
								// Log full error details - this will appear in n8n execution logs
								if (this.logger) {
									this.logger.error('Upload request failed', {
										statusCode,
										errorResponse: errorResponse ? JSON.stringify(errorResponse, null, 2) : 'No response data',
										errorMessage,
										axiosErrorCode: axiosError.code,
										axiosErrorMessage: axiosError.message,
										fileName: binaryData.fileName,
										mimeType: binaryData.mimeType,
										endpoint,
										url: `${docAnalysisUrl}${endpoint}`,
									});
								}
								
								// Always include the full error response in the error message so user can see it
								const fullErrorDetails = errorResponse
									? `\n\nFull error response: ${JSON.stringify(errorResponse, null, 2)}`
									: `\n\nError: ${axiosError.message || JSON.stringify(axiosError)}`;
								
								throw new NodeOperationError(
									this.getNode(),
									`Upload failed (${statusCode || 'unknown'}): ${errorMessage}${fullErrorDetails}`,
									{ itemIndex: i },
								);
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
						const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
						const qs: IDataObject = {};

						// Log parameters for debugging
						if (this.logger) {
							this.logger.debug('[Deals GetAll] Parameters:', {
								returnAll,
								filters,
								limitParam: this.getNodeParameter('limit', i, 50),
							});
						}

						// Copy only non-empty filter values
						if (filters && typeof filters === 'object') {
							Object.keys(filters).forEach((key) => {
								const value = filters[key];
								if (value !== undefined && value !== null && value !== '') {
									qs[key] = value;
								}
							});
						}

						if (!returnAll) {
							const limit = this.getNodeParameter('limit', i, 50) as number;
							if (limit && limit > 0) {
								qs.page_size = limit;
								// Don't send page=1 explicitly, API might handle first page automatically
							}

							const pageResponse = await clairaApiRequest.call(
								this,
								'GET',
								'/credit_analysis/deals/',
								undefined,
								qs,
							);

							// Log the raw response for debugging
							if (this.logger) {
								this.logger.debug('[Deals GetAll] Raw response:', {
									isArray: Array.isArray(pageResponse),
									type: typeof pageResponse,
									keys: typeof pageResponse === 'object' && pageResponse !== null ? Object.keys(pageResponse) : 'N/A',
									fullResponse: JSON.stringify(pageResponse, null, 2),
								});
							}

							// Handle different response structures
							if (Array.isArray(pageResponse)) {
								responseData = pageResponse.length > 0 ? pageResponse : undefined;
							} else if (pageResponse && typeof pageResponse === 'object') {
								// Check for 'deals' key
								if ('deals' in pageResponse) {
									const deals = pageResponse.deals;
									if (Array.isArray(deals) && deals.length > 0) {
										responseData = deals as IDataObject[];
									} else {
										responseData = undefined;
									}
								}
								// Check for 'data' key
								else if ('data' in pageResponse) {
									const data = pageResponse.data;
									if (data && typeof data === 'object') {
										if ('deals' in data && Array.isArray(data.deals) && data.deals.length > 0) {
											responseData = data.deals as IDataObject[];
										} else if (Array.isArray(data) && data.length > 0) {
											responseData = data as IDataObject[];
										} else {
											responseData = undefined;
										}
									} else {
										responseData = undefined;
									}
								}
								// If it's an empty object or doesn't match expected structure
								else if (Object.keys(pageResponse).length === 0) {
									responseData = undefined;
								}
								// If response has other keys, try to find array values
								else {
									const values = Object.values(pageResponse);
									const arrayValue = values.find((v) => Array.isArray(v) && v.length > 0);
									responseData = arrayValue ? (arrayValue as IDataObject[]) : undefined;
								}
							} else {
								responseData = undefined;
							}
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

								let deals: IDataObject[] = [];
								
								// Handle different response structures
								if (Array.isArray(pageResponse)) {
									deals = pageResponse.length > 0 ? pageResponse : [];
								} else if (pageResponse && typeof pageResponse === 'object') {
									// Check for 'deals' key
									if ('deals' in pageResponse) {
										const dealsArray = pageResponse.deals;
										if (Array.isArray(dealsArray)) {
											deals = dealsArray as IDataObject[];
										}
									}
									// Check for 'data' key
									else if ('data' in pageResponse) {
										const data = pageResponse.data;
										if (data && typeof data === 'object') {
											if ('deals' in data && Array.isArray(data.deals)) {
												deals = data.deals as IDataObject[];
											} else if (Array.isArray(data)) {
												deals = data as IDataObject[];
											}
										}
									}
									// If response has other keys, try to find array values
									else {
										const values = Object.values(pageResponse);
										const arrayValue = values.find((v) => Array.isArray(v));
										if (arrayValue) {
											deals = arrayValue as IDataObject[];
										}
									}
								}

								if (deals.length > 0) {
									allDeals.push(...deals);

									// Check if there are more pages
									const totalCount = (pageResponse.count as number) || 
										((pageResponse.data as IDataObject)?.count as number) || 
										allDeals.length;
									const pageSize = ((pageResponse.page_size as number) || 
										((pageResponse.data as IDataObject)?.page_size as number) || 
										(qs.page_size as number) || 100) as number;
									const totalPages = Math.ceil(totalCount / pageSize);

									if (currentPage < totalPages && deals.length === pageSize) {
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
						if (responseData.length > 0) {
							returnData.push(...responseData);
						}
					} else if (responseData !== null && typeof responseData === 'object' && Object.keys(responseData).length > 0) {
						returnData.push(responseData);
					} else if (responseData !== null && typeof responseData !== 'object') {
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
