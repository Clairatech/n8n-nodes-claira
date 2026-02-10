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
	clairaModulesManagerRequest,
	clairaSuperAdminRequest,
} from './shared/transport';
import {
	formatDealsToMarkdown,
	formatDealToMarkdown,
	formatCreatedDealToMarkdown,
	formatDealStatusToMarkdown,
	formatSetStatusToMarkdown,
	formatStatusOptionsToMarkdown,
	formatActivitiesToMarkdown,
	formatCreatedActivityToMarkdown,
	formatReportsToMarkdown,
	formatReportSectionsToMarkdown,
} from './shared/formatters';
import { authDescription } from './resources/auth';
import { documentDescription } from './resources/documents';
import { dealDescription } from './resources/deals';
import { folderDescription } from './resources/folders';
import { financialDataDescription } from './resources/financialData';
import { dashboardTemplateDescription } from './resources/dashboardTemplates';
import { superAdminDescription } from './resources/superAdmin';

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
						{
							name: 'Super Admin',
							value: 'superAdmin',
							description: 'Super admin operations (clients, users)',
						},
					],
					default: 'documents',
				},
				{
					displayName: 'Client ID',
					name: 'clientId',
					type: 'string',
					required: true,
					default: '',
					description: 'The client ID for API requests',
					displayOptions: {
						hide: {
							resource: ['auth', 'superAdmin'],
						},
					},
				},
			...authDescription,
			...documentDescription,
			...dealDescription,
			...folderDescription,
			...financialDataDescription,
			...dashboardTemplateDescription,
			...superAdminDescription,
		],
	};

	async execute(this: IExecuteFunctions) {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;
		const clientId = (resource !== 'auth' && resource !== 'superAdmin') ? this.getNodeParameter('clientId', 0) as string : '';

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
							clientId,
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
							clientId,
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
						} catch {
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
					const uploadUrl = `${docAnalysisUrl}/clients/${clientId}${endpoint}`;

					// Get binary data buffer and metadata
					const binaryData = item.binary[binaryPropertyName];
					const binaryBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
					
					// Manually construct multipart/form-data body (no external deps)
					const boundary = '----n8nFormBoundary' + Date.now().toString(36) + Math.random().toString(36).substring(2);
					const parts: Buffer[] = [];
					
					// Add file field
					const fileName = binaryData.fileName || 'file';
					const mimeType = binaryData.mimeType || 'application/octet-stream';
					parts.push(Buffer.from(
						`--${boundary}\r\n` +
						`Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
						`Content-Type: ${mimeType}\r\n\r\n`
					));
					parts.push(binaryBuffer);
					parts.push(Buffer.from('\r\n'));

					// Add other fields
					if (folderId) {
						parts.push(Buffer.from(
							`--${boundary}\r\n` +
							`Content-Disposition: form-data; name="folder_id"\r\n\r\n` +
							`${folderId}\r\n`
						));
					}
					if (financialTypeIds) {
						try {
							const parsedIds =
								typeof financialTypeIds === 'string'
									? JSON.parse(financialTypeIds)
									: financialTypeIds;
							parts.push(Buffer.from(
								`--${boundary}\r\n` +
								`Content-Disposition: form-data; name="financial_type_ids"\r\n\r\n` +
								`${JSON.stringify(parsedIds)}\r\n`
							));
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
							parts.push(Buffer.from(
								`--${boundary}\r\n` +
								`Content-Disposition: form-data; name="metadata"\r\n\r\n` +
								`${JSON.stringify(parsedMetadata)}\r\n`
							));
						} catch {
							throw new NodeOperationError(
								this.getNode(),
								'Metadata must be a valid JSON object',
							);
						}
					}
					
					// End boundary
					parts.push(Buffer.from(`--${boundary}--\r\n`));
					const body = Buffer.concat(parts);
						
					const requestOptions: IHttpRequestOptions = {
						method: 'POST',
						url: uploadUrl,
						headers: {
							Authorization: `Bearer ${accessToken}`,
							'Content-Type': `multipart/form-data; boundary=${boundary}`,
							'Content-Length': body.length.toString(),
						},
						body,
						json: false,
					};

					// Log request details for debugging
					if (this.logger) {
						this.logger.debug('Upload request', {
							url: uploadUrl,
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
								const axiosError = error as { response?: { status?: number; data?: IDataObject }; statusCode?: number; code?: string; message?: string };
								const statusCode = axiosError.response?.status || axiosError.statusCode || axiosError.code;
								const errorResponse = axiosError.response?.data;
								
								// Try to extract Flask error message (Flask can return errors in various formats)
								let errorMessage = 'Unknown error';
								if (errorResponse) {
									// Try different common Flask error formats
									errorMessage =
										(errorResponse.message as string) ||
										(errorResponse.error as string) ||
										(errorResponse.detail as string) ||
										(errorResponse.description as string) ||
										(errorResponse.msg as string) ||
										(Array.isArray(errorResponse.file) ? errorResponse.file[0] : errorResponse.file) as string || // Field-specific errors
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
										url: uploadUrl,
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
							clientId,
						);
					}
				} else if (resource === 'deals') {
					const outputFormat = this.getNodeParameter('outputFormat', i, 'json') as string;

					if (operation === 'getAll') {
						const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
						const includeSectionContents = this.getNodeParameter('includeSectionContents', i, false) as boolean;
						const includeLatestActivities = this.getNodeParameter('includeLatestActivities', i, false) as boolean;
						const qs: IDataObject = {};

						// Log parameters for debugging
						if (this.logger) {
							this.logger.debug('[Deals GetAll] Parameters:', {
								returnAll,
								filters,
								includeSectionContents,
								includeLatestActivities,
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

						// If includeSectionContents, fetch analyses config to get section columns
						if (includeSectionContents) {
							try {
								const configResponse = await clairaApiRequest.call(
									this,
									'GET',
									'/credit_analysis/analyses/config/',
									clientId,
								);

								// Response is { data: { ..., dashboards_config: { deals: { columns: {...} } } } }
								const configData = (configResponse.data as IDataObject) || configResponse;
								const dashboardsConfig = (configData.dashboards_config as IDataObject) || {};
								const dealsConfig = (dashboardsConfig.deals as IDataObject) || {};
								const columns = (dealsConfig.columns as IDataObject) || {};

								// Filter section-type columns and build base64-encoded section_columns param
								const sectionColumns: string[] = [];
								for (const [, colConfig] of Object.entries(columns)) {
									const col = colConfig as IDataObject;
									if (col.type === 'section' && col.dashboard_name && col.section_name) {
										const encodedDashboard = Buffer.from(String(col.dashboard_name)).toString('base64')
											.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
										const encodedSection = Buffer.from(String(col.section_name)).toString('base64')
											.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
										sectionColumns.push(`${encodedDashboard}__${encodedSection}`);
									}
								}

								if (sectionColumns.length > 0) {
									qs.section_columns = sectionColumns.join(',');
								}

								if (this.logger) {
									this.logger.debug('[Deals GetAll] Section columns:', {
										columnCount: sectionColumns.length,
										sectionColumns: qs.section_columns,
									});
								}
							} catch (error) {
								if (this.logger) {
									this.logger.warn('[Deals GetAll] Failed to fetch section columns from config', {
										error: error instanceof Error ? error.message : String(error),
									});
								}
							}
						}

						if (includeLatestActivities) {
							qs.latest_activities = 1;
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
								clientId,
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
							qs.page_size = 50;
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
									clientId,
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
							clientId,
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
							clientId,
							body,
						);
					} else if (operation === 'getStatus') {
						const dealId = this.getNodeParameter('dealId', i) as string;
						const dealResponse = await clairaApiRequest.call(
							this,
							'GET',
							`/credit_analysis/deals/${dealId}/`,
							clientId,
						);

						// Log full response for debugging
						if (this.logger) {
							this.logger.debug('[Get Status] Full response:', {
								responseKeys: Object.keys(dealResponse),
								fullResponse: JSON.stringify(dealResponse).substring(0, 1000),
							});
						}

						// Response structure: { data: { id, asset_id, data: { status, ... }, ... } }
						const deal = (dealResponse.data as IDataObject) || dealResponse;
						const dealDataField = (deal.data as IDataObject) || {};
						const status = dealDataField.status || null;

						responseData = {
							deal_id: dealId,
							status,
						};
					} else if (operation === 'setStatus') {
						const dealId = this.getNodeParameter('dealId', i) as string;
						const status = this.getNodeParameter('status', i) as string;
						const moduleVersion = this.getNodeParameter('moduleVersion', i, 'latest') as string;

						// First get the existing deal to preserve other data fields
						const existingDealResponse = await clairaApiRequest.call(
							this,
							'GET',
							`/credit_analysis/deals/${dealId}/`,
							clientId,
						);

						// Response structure: { data: { id, asset_id, data: { status, ... }, ... } }
						const existingDeal = (existingDealResponse.data as IDataObject) || existingDealResponse;
						const existingDataField = (existingDeal.data as IDataObject) || {};

						// Merge status into existing data field
						const body: IDataObject = {
							data: {
								...existingDataField,
								status,
							},
						};

						const updateResponse = await clairaApiRequest.call(
							this,
							'PATCH',
							`/credit_analysis/deals/${dealId}/`,
							clientId,
							body,
						);

						// Check if we need to create reports from templates for this status
						const createdReports: IDataObject[] = [];
						try {
							// Fetch module config to get deal_report_rules
							const moduleConfig = await clairaModulesManagerRequest.call(
								this,
								'GET',
								`/modules/credit_analysis/configs/${moduleVersion}/`,
								clientId,
							);

							// Extract deal_report_rules from titles.ent_ids.deal_report_rules
							const titles = (moduleConfig.titles as IDataObject) || {};
							const entIds = (titles.ent_ids as IDataObject) || {};
							const dealReportRules = (entIds.deal_report_rules as IDataObject) || {};
							const statusRules = (dealReportRules[status] as IDataObject) || {};
							const createReportsFromTemplates = (statusRules.createReportsFromTemplates as string[]) || [];

							if (createReportsFromTemplates.length > 0) {
								// Get all templates
								const templates = await clairaApiRequest.call(
									this,
									'GET',
									'/credit_analysis/dashboard-templates/',
									clientId,
								);

								const templatesList: IDataObject[] = Array.isArray(templates)
									? (templates as IDataObject[])
									: ((templates as IDataObject).data as IDataObject[]) || [];

								// Create reports from each template (by name)
								for (const templateName of createReportsFromTemplates) {
									const template = templatesList.find(
										(t: IDataObject) => t.title === templateName,
									) as IDataObject | undefined;

									if (!template) {
										if (this.logger) {
											this.logger.warn(`[setStatus] Report Agent "${templateName}" not found, skipping`);
										}
										continue;
									}

									// Create dashboard from template
									const dashboardBody: IDataObject = {
										deal_id: dealId,
										title: (template.title as string) || 'Report',
										public: true,
										is_default: false,
									};

									const dashboardResponse = await clairaApiRequest.call(
										this,
										'POST',
										'/credit_analysis/dashboards/',
										clientId,
										dashboardBody,
									) as IDataObject;

									const dashboard = (dashboardResponse.data as IDataObject) || dashboardResponse;
									const dashboardId = dashboard.id || dashboard.dashboard_id;

									if (dashboardId) {
										// Create sections from template
										const templateValue = template.value as IDataObject;
										const templateSections = (templateValue?.sections as IDataObject[]) || [];
										if (Array.isArray(templateSections) && templateSections.length > 0) {
											for (let index = 0; index < templateSections.length; index++) {
												const sectionTemplate = templateSections[index];
												const sectionBody: IDataObject = {
													...sectionTemplate,
													dashboard_id: dashboardId,
													position: sectionTemplate.position !== undefined ? sectionTemplate.position : index + 1,
													value: sectionTemplate.value !== undefined ? sectionTemplate.value : {},
												};

												delete sectionBody.id;
												delete sectionBody.template_id;
												delete sectionBody.last_modified_by;
												delete sectionBody.last_modified_at;

												if (sectionBody.context_settings) {
													const contextSettings = sectionBody.context_settings as IDataObject;
													sectionBody.use_documents = contextSettings.use_documents;
													sectionBody.use_spreadsheets = contextSettings.use_spreadsheets;
													sectionBody.use_sections = contextSettings.use_sections;
													sectionBody.document_ids = contextSettings.document_ids;
													sectionBody.start_date = contextSettings.start_date;
													sectionBody.end_date = contextSettings.end_date;
													delete sectionBody.context_settings;
												}

												await clairaApiRequest.call(
													this,
													'POST',
													'/credit_analysis/dashboard-sections/',
													clientId,
													sectionBody,
												);
											}
										}

										createdReports.push({
											template_id: template.id,
											template_name: templateName,
											dashboard_id: dashboardId,
											title: dashboard.title,
										});
									}
								}
							}
						} catch (error) {
							// Log but don't fail if report creation fails
							if (this.logger) {
								this.logger.warn('[setStatus] Failed to create reports from templates', {
									error: error instanceof Error ? error.message : String(error),
								});
							}
						}

						responseData = {
							...(updateResponse as IDataObject),
							created_reports: createdReports,
						};
					} else if (operation === 'getStatusOptions') {
						const moduleVersion = this.getNodeParameter('moduleVersion', i, 'latest') as string;

						// Fetch module config from modules manager
						const moduleConfig = await clairaModulesManagerRequest.call(
							this,
							'GET',
							`/modules/credit_analysis/configs/${moduleVersion}/`,
							clientId,
						);

						// Log response for debugging
						if (this.logger) {
							this.logger.debug('[Get Status Options] Module config keys:', {
								keys: Object.keys(moduleConfig),
								dashboards: JSON.stringify(moduleConfig.dashboards).substring(0, 500),
							});
						}

						// Extract status options from dashboards.deals.columns['data.status'].tags
						// API returns 'dashboards' not 'dashboards_config'
						const dashboards = (moduleConfig.dashboards as IDataObject) || {};
						const dealsConfig = (dashboards.deals as IDataObject) || {};
						const columnsConfig = (dealsConfig.columns as IDataObject) || {};
						const statusColumnConfig = (columnsConfig['data.status'] as IDataObject) || {};
						const tagsString = (statusColumnConfig.tags as string) || '';

						// Parse comma-separated tags into array
						const statusOptions = tagsString
							.split('|')
							.map((s: string) => s.trim())
							.filter((s: string) => s !== '');

						// Extract deal_report_rules from titles.ent_ids.deal_report_rules
						const titles = (moduleConfig.titles as IDataObject) || {};
						const entIds = (titles.ent_ids as IDataObject) || {};
						const dealReportRules = (entIds.deal_report_rules as IDataObject) || {};

						responseData = {
							status_options: statusOptions,
							deal_report_rules: dealReportRules,
						};
					} else if (operation === 'getActivities') {
						const activityScope = this.getNodeParameter('activityScope', i, 'deal') as string;
						const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
						const qs: IDataObject = {
							'created_at:desc': '', // Sort by newest first
						};

						if (!returnAll) {
							const limit = this.getNodeParameter('limit', i, 10) as number;
							qs.page_size = limit;
							qs.page = 1;
						}

						let endpoint: string;
						if (activityScope === 'all') {
							// Get activities across all deals
							endpoint = '/credit_analysis/deals/activities/';
						} else {
							// Get activities for a specific deal
							const dealId = this.getNodeParameter('dealId', i) as string;
							endpoint = `/credit_analysis/deals/${dealId}/activities/`;
						}

						const activitiesResponse = await clairaApiRequest.call(
							this,
							'GET',
							endpoint,
							clientId,
							undefined,
							qs,
						);

						// Extract activities from response
						if (activitiesResponse && typeof activitiesResponse === 'object') {
							if ('data' in activitiesResponse) {
								const dataObj = activitiesResponse.data as IDataObject;
								responseData = (dataObj.activities as IDataObject[]) || activitiesResponse;
							} else if ('activities' in activitiesResponse) {
								responseData = activitiesResponse.activities as IDataObject[];
							} else {
								responseData = activitiesResponse;
							}
						} else {
							responseData = activitiesResponse;
						}
					} else if (operation === 'createActivity') {
						const dealId = this.getNodeParameter('dealId', i) as string;
						const title = this.getNodeParameter('title', i) as string;
						const description = this.getNodeParameter('description', i, '') as string;
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

						const body: IDataObject = {
							title,
						};

						if (description) {
							body.description = description;
						}

						// Handle additional fields
						if (additionalFields.docIds) {
							const docIdsStr = additionalFields.docIds as string;
							body.doc_ids = docIdsStr.split(',').map((id: string) => id.trim()).filter((id: string) => id);
						}

						if (additionalFields.dashboardIds) {
							const dashboardIdsStr = additionalFields.dashboardIds as string;
							body.deal_analysis_dashboard_ids = dashboardIdsStr.split(',').map((id: string) => id.trim()).filter((id: string) => id);
						}

						if (additionalFields.sectionIds) {
							const sectionIdsStr = additionalFields.sectionIds as string;
							body.dashboard_section_ids = sectionIdsStr.split(',').map((id: string) => id.trim()).filter((id: string) => id);
						}

						if (additionalFields.data) {
							try {
								body.data = typeof additionalFields.data === 'string' 
									? JSON.parse(additionalFields.data) 
									: additionalFields.data;
							} catch {
								body.data = {};
							}
						}

						const activityResponse = await clairaApiRequest.call(
							this,
							'POST',
							`/credit_analysis/deals/${dealId}/activities/`,
							clientId,
							body,
						);

						// Extract activity from response
						responseData = ((activityResponse as IDataObject).data as IDataObject) || activityResponse;
					} else if (operation === 'getReports') {
						const dealId = this.getNodeParameter('dealId', i) as string;
						const includeSections = this.getNodeParameter('includeSections', i, false) as boolean;

						const reportsResponse = await clairaApiRequest.call(
							this,
							'GET',
							`/credit_analysis/dashboards/${dealId}/`,
							clientId,
						);

						// Extract reports (dashboards) from response
						const reports = (reportsResponse.data as IDataObject[]) || reportsResponse;

						// If includeSections is true, fetch sections for each report
						if (includeSections && Array.isArray(reports)) {
							for (const report of reports) {
								const dashboardId = report.id as string;
								if (dashboardId) {
									try {
										const sectionsResponse = await clairaApiRequest.call(
											this,
											'GET',
											`/credit_analysis/dashboard-sections/${dashboardId}/`,
											clientId,
										);
										report.sections = (sectionsResponse.data as IDataObject[]) || sectionsResponse;
									} catch (error) {
										// If sections fetch fails, continue without sections
										if (this.logger) {
											this.logger.warn(`Failed to fetch sections for dashboard ${dashboardId}`, {
												error: error instanceof Error ? error.message : String(error),
											});
										}
										report.sections = [];
									}
								}
							}
						}

						responseData = reports;
					} else if (operation === 'getReportSections') {
						const reportId = this.getNodeParameter('reportId', i) as string;

						const sectionsResponse = await clairaApiRequest.call(
							this,
							'GET',
							`/credit_analysis/dashboard-sections/${reportId}/`,
							clientId,
						);

						// Extract sections from response
						responseData = (sectionsResponse.data as IDataObject[]) || sectionsResponse;
					}

					// Apply markdown formatting if requested
					if (outputFormat === 'markdown' && responseData !== undefined) {
						let markdownContent = '';

						if (operation === 'getAll') {
							const deals = Array.isArray(responseData) ? responseData : [responseData];
							markdownContent = formatDealsToMarkdown(deals as IDataObject[]);
						} else if (operation === 'get') {
							markdownContent = formatDealToMarkdown(responseData as IDataObject);
						} else if (operation === 'create') {
							markdownContent = formatCreatedDealToMarkdown(responseData as IDataObject);
						} else if (operation === 'getStatus') {
							markdownContent = formatDealStatusToMarkdown(responseData as IDataObject);
						} else if (operation === 'setStatus') {
							markdownContent = formatSetStatusToMarkdown(responseData as IDataObject);
						} else if (operation === 'getStatusOptions') {
							markdownContent = formatStatusOptionsToMarkdown(responseData as IDataObject);
						} else if (operation === 'getActivities') {
							const activities = Array.isArray(responseData) ? responseData : [responseData];
							markdownContent = formatActivitiesToMarkdown(activities as IDataObject[]);
						} else if (operation === 'createActivity') {
							markdownContent = formatCreatedActivityToMarkdown(responseData as IDataObject);
						} else if (operation === 'getReports') {
							const dealId = this.getNodeParameter('dealId', i) as string;
							const reports = Array.isArray(responseData) ? responseData : [responseData];
							markdownContent = formatReportsToMarkdown(reports as IDataObject[], dealId);
						} else if (operation === 'getReportSections') {
							const sections = Array.isArray(responseData) ? responseData : [responseData];
							markdownContent = formatReportSectionsToMarkdown(sections as IDataObject[]);
						}

						if (markdownContent) {
							responseData = { markdown: markdownContent };
						}
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
							clientId,
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
							clientId,
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
							clientId,
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
							clientId,
						);
					} else if (operation === 'getTables') {
						const docId = this.getNodeParameter('docId', i) as string;
						responseData = await clairaApiRequest.call(
							this,
							'GET',
							`/credit_analysis/docs/${docId}/fin_data_tables/`,
							clientId,
						);
					}
				} else if (resource === 'dashboardTemplates') {
					if (operation === 'getAll') {
						responseData = await clairaApiRequest.call(
							this,
							'GET',
							'/credit_analysis/dashboard-templates/',
							clientId,
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

						// Get all templates and filter locally by ID
						const templates = await clairaApiRequest.call(
							this,
							'GET',
							'/credit_analysis/dashboard-templates/',
							clientId,
						);
						
						// Extract templates list from response
						const templatesList: IDataObject[] = Array.isArray(templates)
							? (templates as IDataObject[])
							: ((templates as IDataObject).data as IDataObject[]) || [];
						
						// Find template by ID
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

						const dashboardResponse = await clairaApiRequest.call(
							this,
							'POST',
							'/credit_analysis/dashboards/',
							clientId,
							dashboardBody,
						) as IDataObject;

						// Get dashboard from response (might be wrapped in 'data')
						const dashboard = (dashboardResponse.data as IDataObject) || dashboardResponse;

						// Get dashboard ID from response
						const dashboardId = dashboard.id || dashboard.dashboard_id;
						if (!dashboardId) {
							throw new NodeOperationError(
								this.getNode(),
								'Failed to get dashboard ID from response',
								{ itemIndex: i },
							);
						}

						// Create sections from template
						// Sections are nested in template.value.sections
						const templateValue = template.value as IDataObject;
						const templateSections = (templateValue?.sections as IDataObject[]) || [];
						if (Array.isArray(templateSections) && templateSections.length > 0) {
							for (let index = 0; index < templateSections.length; index++) {
								const sectionTemplate = templateSections[index];
								// Create section based on template structure
								// Copy the template section and set dashboard_id
								const sectionBody: IDataObject = {
									...sectionTemplate,
									dashboard_id: dashboardId,
									position: sectionTemplate.position !== undefined ? sectionTemplate.position : index + 1,
									value: sectionTemplate.value !== undefined ? sectionTemplate.value : {},
								};

								// Remove template-specific fields that shouldn't be sent
								delete sectionBody.id;
								delete sectionBody.template_id;
								delete sectionBody.last_modified_by;
								delete sectionBody.last_modified_at;

								// Handle context_settings - flatten if it exists
								if (sectionBody.context_settings) {
									const contextSettings = sectionBody.context_settings as IDataObject;
									sectionBody.use_documents = contextSettings.use_documents;
									sectionBody.use_spreadsheets = contextSettings.use_spreadsheets;
									sectionBody.use_sections = contextSettings.use_sections;
									sectionBody.document_ids = contextSettings.document_ids;
									sectionBody.start_date = contextSettings.start_date;
									sectionBody.end_date = contextSettings.end_date;
									delete sectionBody.context_settings;
								}

								await clairaApiRequest.call(
									this,
									'POST',
									'/credit_analysis/dashboard-sections/',
									clientId,
									sectionBody,
								);
							}
						}

						responseData = dashboard;
					}
				} else if (resource === 'superAdmin') {
					if (operation === 'getClients') {
						const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
						const qs: IDataObject = { ...filters };

						if (!returnAll) {
							const limit = this.getNodeParameter('limit', i, 50) as number;
							qs.page_size = limit;
							qs.page = 1;
						}

						if (returnAll) {
							// Fetch all pages
							qs.page_size = 100;
							qs.page = 1;

							const allClients: IDataObject[] = [];
							let hasMore = true;
							let currentPage = 1;

							while (hasMore) {
								qs.page = currentPage;
								const pageResponse = await clairaSuperAdminRequest.call(
									this,
									'GET',
									'/clients/',
									undefined,
									qs,
								);

								// Extract clients from response
								const data = (pageResponse.data as IDataObject) || pageResponse;
								const clients = (data.clients as IDataObject[]) || [];

								if (clients.length > 0) {
									allClients.push(...clients);
									const pageSize = (data.page_size as number) || 100;
									if (clients.length < pageSize) {
										hasMore = false;
									} else {
										currentPage++;
									}
								} else {
									hasMore = false;
								}

								// Safety check
								if (currentPage > 1000) {
									hasMore = false;
								}
							}

							responseData = allClients;
						} else {
							const pageResponse = await clairaSuperAdminRequest.call(
								this,
								'GET',
								'/clients/',
								undefined,
								qs,
							);

							// Extract clients from response
							const data = (pageResponse.data as IDataObject) || pageResponse;
							responseData = (data.clients as IDataObject[]) || [];
						}
					} else if (operation === 'getUsers') {
						const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
						const filters = this.getNodeParameter('filters', i, {}) as IDataObject;
						const qs: IDataObject = { ...filters };

						if (!returnAll) {
							const limit = this.getNodeParameter('limit', i, 50) as number;
							qs.page_size = limit;
							qs.page = 1;
						}

						if (returnAll) {
							// Fetch all pages (max page_size is 50 per API validation)
							qs.page_size = 50;
							qs.page = 1;

							const allUsers: IDataObject[] = [];
							let hasMore = true;
							let currentPage = 1;

							while (hasMore) {
								qs.page = currentPage;
								const pageResponse = await clairaSuperAdminRequest.call(
									this,
									'GET',
									'/users/',
									undefined,
									qs,
								);

								// Extract users from response
								const data = (pageResponse.data as IDataObject) || pageResponse;
								const users = (data.users as IDataObject[]) || [];

								if (users.length > 0) {
									allUsers.push(...users);
									const pageSize = (data.page_size as number) || 50;
									if (users.length < pageSize) {
										hasMore = false;
									} else {
										currentPage++;
									}
								} else {
									hasMore = false;
								}

								// Safety check
								if (currentPage > 1000) {
									hasMore = false;
								}
							}

							responseData = allUsers;
						} else {
							const pageResponse = await clairaSuperAdminRequest.call(
								this,
								'GET',
								'/users/',
								undefined,
								qs,
							);

							// Extract users from response
							const data = (pageResponse.data as IDataObject) || pageResponse;
							responseData = (data.users as IDataObject[]) || [];
						}
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
