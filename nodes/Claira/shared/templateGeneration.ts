import type { IDataObject } from 'n8n-workflow';

export function unwrapResponseData(response: IDataObject): IDataObject {
	const data = response.data;
	if (data && typeof data === 'object' && !Array.isArray(data)) {
		return data as IDataObject;
	}

	return response;
}

export function normalizeTriggeredRulesForCreatedReports(triggeredRules: IDataObject[]): IDataObject[] {
	return triggeredRules.map((rule) => {
		const templateTitle = rule.template_title || rule.template_name || rule.title;

		return {
			...rule,
			template_name: templateTitle,
			title: templateTitle,
		};
	});
}

export function buildFromTemplateRequestBody(
	dealId: string,
	templateId: string,
	forceCreateNew: boolean,
): IDataObject {
	return {
		deal_id: dealId,
		template_id: templateId,
		force_create_new: forceCreateNew,
	};
}
