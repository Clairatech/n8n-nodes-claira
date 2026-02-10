import type { IDataObject } from 'n8n-workflow';

const PLATFORM_BASE_URL = 'https://platform.claira.io';

function formatDate(dateStr: string | undefined): string {
	if (!dateStr) return 'N/A';
	try {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	} catch {
		return dateStr;
	}
}

function getDealUrl(dealId: string, dashboardId?: string): string {
	const dashboard = dashboardId || 'documents';
	return `${PLATFORM_BASE_URL}/deal_analysis_ca/${dealId}?dashboard_id=${dashboard}`;
}

function formatValue(value: unknown): string {
	if (value === null || value === undefined) return 'N/A';
	if (typeof value === 'string') return value || 'N/A';
	if (typeof value === 'number' || typeof value === 'boolean') return String(value);
	if (Array.isArray(value)) {
		if (value.length === 0) return '(empty)';
		return value.map((v) => formatValue(v)).join(', ');
	}
	if (typeof value === 'object') {
		return JSON.stringify(value);
	}
	return String(value);
}

function formatFieldName(key: string): string {
	// Convert snake_case or camelCase to Title Case
	return key
		.replace(/_/g, ' ')
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatObjectFields(obj: IDataObject, indent = ''): string {
	if (!obj || Object.keys(obj).length === 0) return '';
	
	const lines: string[] = [];
	for (const [key, value] of Object.entries(obj)) {
		const fieldName = formatFieldName(key);
		lines.push(`${indent}- **${fieldName}:** ${formatValue(value)}`);
	}
	return lines.join('\n');
}

function stripHtml(html: string): string {
	return html
		// Remove citation spans like [1], [2]
		.replace(/<span class="citation-ref"[^>]*>\[?\d+\]?<\/span>/g, '')
		// Replace <br /> and <br> with newline
		.replace(/<br\s*\/?>/gi, '\n')
		// Replace </p><p> with double newline
		.replace(/<\/p>\s*<p>/gi, '\n')
		// Remove all remaining HTML tags
		.replace(/<[^>]*>/g, '')
		// Decode common HTML entities
		.replace(/&ldquo;/g, '\u201C')
		.replace(/&rdquo;/g, '\u201D')
		.replace(/&lsquo;/g, '\u2018')
		.replace(/&rsquo;/g, '\u2019')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&nbsp;/g, ' ')
		.replace(/&#\d+;/g, (match) => {
			const code = parseInt(match.replace('&#', '').replace(';', ''), 10);
			return String.fromCharCode(code);
		})
		// Clean up whitespace
		.replace(/\n{3,}/g, '\n')
		.trim();
}

/**
 * Extract clean text from a section content field object.
 * These have structure: { id, dashboard_id, title, type, value: { text: "<html>" }, citations: { ... } }
 */
function formatSectionField(field: IDataObject): string {
	const value = field.value as IDataObject | undefined;
	if (!value) return 'N/A';

	const text = value.text as string | undefined;
	if (!text) return 'N/A';

	return stripHtml(text) || 'N/A';
}

/**
 * Check if an object looks like a section content field (has id, title, type, value.text).
 */
function isSectionContentField(obj: unknown): boolean {
	if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
	const o = obj as IDataObject;
	return !!(o.type && o.value && typeof o.value === 'object' && (o.value as IDataObject).text);
}

/**
 * Format section contents (e.g. "Base Info 1" with fields like Lien, EBITDA, Sector).
 * Extracts clean text from value.text, strips HTML, and optionally includes citation sources.
 */
function formatSectionContentsToMarkdown(sectionContents: IDataObject): string {
	let md = '';

	for (const [sectionKey, sectionValue] of Object.entries(sectionContents)) {
		const sectionName = formatFieldName(sectionKey);
		md += `\n\n#### ${sectionName}`;

		if (sectionValue && typeof sectionValue === 'object' && !Array.isArray(sectionValue)) {
			const fields = sectionValue as IDataObject;
			const lines: string[] = [];

			for (const [fieldKey, fieldValue] of Object.entries(fields)) {
				if (isSectionContentField(fieldValue)) {
					// It's a section content field with value.text — extract clean text
					const cleanText = formatSectionField(fieldValue as IDataObject);
					lines.push(`- **${fieldKey}:** ${cleanText}`);
				} else {
					// Fallback for non-section fields
					lines.push(`- **${formatFieldName(fieldKey)}:** ${formatValue(fieldValue)}`);
				}
			}

			if (lines.length > 0) {
				md += '\n' + lines.join('\n');
			}
		} else {
			md += `\n- ${formatValue(sectionValue)}`;
		}
	}

	return md;
}

export function formatDealToMarkdown(deal: IDataObject): string {
	const dealData = (deal.data as IDataObject) || {};
	const sectionContents = (deal.section_contents as IDataObject) || {};
	const dealId = deal.id as string;
	const assetName = deal.asset_name as string || 'Unnamed Deal';
	const createdAt = formatDate(deal.created_at as string);
	const updatedAt = formatDate(deal.updated_at as string);

	let md = `## ${assetName}
- **ID:** ${dealId}
- **Created:** ${createdAt}
- **Updated:** ${updatedAt}
- **Link:** [Open Deal](${getDealUrl(dealId)})`;

	// Add all fields from data
	if (Object.keys(dealData).length > 0) {
		md += `\n\n### Deal Data`;
		md += '\n' + formatObjectFields(dealData);
	}

	// Add all fields from section_contents
	if (Object.keys(sectionContents).length > 0) {
		md += `\n\n### Section Contents`;
		md += formatSectionContentsToMarkdown(sectionContents);
	}

	return md;
}

export function formatDealsToMarkdown(deals: IDataObject[]): string {
	if (!deals || deals.length === 0) {
		return '# Deals\n\nNo deals found.';
	}

	const header = `# Deals (${deals.length} total)\n`;
	const dealSections = deals.map(formatDealToMarkdown).join('\n\n---\n\n');
	return header + '\n' + dealSections;
}

export function formatDealStatusToMarkdown(data: IDataObject): string {
	const dealId = data.deal_id as string;
	const status = data.status as string || 'No status';

	return `## Deal Status
- **Deal ID:** ${dealId}
- **Status:** ${status}
- **Link:** [Open Deal](${getDealUrl(dealId)})`;
}

export function formatStatusOptionsToMarkdown(data: IDataObject): string {
	const options = (data.status_options as string[]) || [];
	const rules = (data.deal_report_rules as IDataObject) || {};

	let md = `# Status Options\n\n`;

	if (options.length === 0) {
		md += 'No status options available.\n';
	} else {
		md += options.map((opt) => `- ${opt}`).join('\n');
	}

	if (Object.keys(rules).length > 0) {
		md += '\n\n## Report Rules by Status\n';
		for (const [status, rule] of Object.entries(rules)) {
			const ruleObj = rule as IDataObject;
			const templates = (ruleObj.createReportsFromTemplates as string[]) || [];
			if (templates.length > 0) {
				md += `\n**${status}:** Creates reports from ${templates.join(', ')}`;
			}
		}
	}

	return md;
}

export function formatActivityToMarkdown(activity: IDataObject): string {
	const title = activity.title as string || 'Untitled';
	const description = activity.description as string || '';
	const createdAt = formatDate(activity.created_at as string);
	const dealId = activity.deal_id as string;
	const user = activity.user as IDataObject;
	const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || (user.email as string) : 'Unknown';

	let md = `### ${title}
- **Date:** ${createdAt}
- **By:** ${userName}`;

	if (dealId) {
		md += `\n- **Deal:** [View](${getDealUrl(dealId)})`;
	}

	if (description) {
		md += `\n\n${description}`;
	}

	return md;
}

export function formatActivitiesToMarkdown(activities: IDataObject[]): string {
	if (!activities || activities.length === 0) {
		return '# Activities\n\nNo activities found.';
	}

	const header = `# Activities (${activities.length})\n`;
	const activitySections = activities.map(formatActivityToMarkdown).join('\n\n---\n\n');
	return header + '\n' + activitySections;
}

export function formatReportToMarkdown(report: IDataObject, dealId?: string): string {
	const reportId = report.id as string;
	const title = report.title as string || 'Untitled Report';
	const isPublic = report.public ? 'Yes' : 'No';
	const isDefault = report.is_default ? 'Yes' : 'No';
	const createdAt = formatDate(report.created_at as string);
	const sections = (report.sections as IDataObject[]) || [];

	const actualDealId = dealId || (report.deal_id as string);

	let md = `## ${title}
- **ID:** ${reportId}
- **Public:** ${isPublic}
- **Default:** ${isDefault}
- **Created:** ${createdAt}`;

	if (actualDealId) {
		md += `\n- **Link:** [Open Report](${getDealUrl(actualDealId, reportId)})`;
	}

	if (sections.length > 0) {
		md += `\n\n### Sections (${sections.length})`;
		for (const section of sections) {
			const sectionTitle = section.title as string || 'Untitled Section';
			const sectionType = section.section_type as string || 'unknown';
			const sectionValue = section.value as IDataObject;
			const textContent = extractTextFromValue(sectionValue);
			
			md += `\n\n#### ${sectionTitle} (${sectionType})`;
			if (textContent) {
				md += `\n\n${textContent}`;
			}
		}
	}

	return md;
}

export function formatReportsToMarkdown(reports: IDataObject[], dealId?: string): string {
	if (!reports || reports.length === 0) {
		return '# Reports\n\nNo reports found.';
	}

	const header = `# Reports (${reports.length})\n`;
	const reportSections = reports.map((r) => formatReportToMarkdown(r, dealId)).join('\n\n---\n\n');
	return header + '\n' + reportSections;
}

function extractTextFromValue(value: IDataObject | unknown): string {
	if (!value) return '';
	
	if (typeof value === 'string') return value;
	
	if (typeof value === 'object' && value !== null) {
		const obj = value as IDataObject;
		
		// Common text field names in section values
		if (obj.text && typeof obj.text === 'string') return obj.text;
		if (obj.content && typeof obj.content === 'string') return obj.content;
		if (obj.markdown && typeof obj.markdown === 'string') return obj.markdown;
		if (obj.html && typeof obj.html === 'string') {
			// Strip HTML tags for plain text
			return (obj.html as string).replace(/<[^>]*>/g, '').trim();
		}
		if (obj.body && typeof obj.body === 'string') return obj.body;
		if (obj.summary && typeof obj.summary === 'string') return obj.summary;
		if (obj.analysis && typeof obj.analysis === 'string') return obj.analysis;
		if (obj.response && typeof obj.response === 'string') return obj.response;
		if (obj.output && typeof obj.output === 'string') return obj.output;
		
		// If value has nested content, try to extract recursively
		if (obj.value) return extractTextFromValue(obj.value);
		if (obj.data) return extractTextFromValue(obj.data);
		
		// Check for array of items with text
		if (Array.isArray(obj.items)) {
			const texts = obj.items
				.map((item: unknown) => extractTextFromValue(item))
				.filter((t: string) => t);
			if (texts.length > 0) return texts.join('\n\n');
		}
		
		// Last resort: look for any string field that looks like content
		for (const [key, val] of Object.entries(obj)) {
			if (typeof val === 'string' && val.length > 50 && !key.includes('id') && !key.includes('url')) {
				return val;
			}
		}
	}
	
	return '';
}

export function formatReportSectionToMarkdown(section: IDataObject): string {
	const title = section.title as string || 'Untitled Section';
	const sectionType = section.section_type as string || 'unknown';
	const position = section.position as number;
	const value = section.value as IDataObject;

	let md = `## ${title}
- **Type:** ${sectionType}
- **Position:** ${position}`;

	// Extract text content from value
	const textContent = extractTextFromValue(value);
	
	if (textContent) {
		md += `\n\n### Content\n\n${textContent}`;
	} else if (value && Object.keys(value).length > 0) {
		// Fallback: show all fields if no text found
		md += `\n\n### Content`;
		md += '\n' + formatObjectFields(value);
	}

	return md;
}

export function formatReportSectionsToMarkdown(sections: IDataObject[]): string {
	if (!sections || sections.length === 0) {
		return '# Report Sections\n\nNo sections found.';
	}

	const header = `# Report Sections (${sections.length})\n`;
	const sectionBlocks = sections.map(formatReportSectionToMarkdown).join('\n\n---\n\n');
	return header + '\n' + sectionBlocks;
}

export function formatCreatedDealToMarkdown(deal: IDataObject): string {
	const dealData = (deal.data as IDataObject) || {};
	const sectionContents = (deal.section_contents as IDataObject) || {};
	const dealId = deal.id as string;
	const assetName = deal.asset_name as string || 'Unnamed Deal';
	const assetId = deal.asset_id as string;

	let md = `# Deal Created

## ${assetName}
- **Deal ID:** ${dealId}
- **Asset ID:** ${assetId}
- **Link:** [Open Deal](${getDealUrl(dealId)})`;

	// Add all fields from data
	if (Object.keys(dealData).length > 0) {
		md += `\n\n### Deal Data`;
		md += '\n' + formatObjectFields(dealData);
	}

	// Add all fields from section_contents
	if (Object.keys(sectionContents).length > 0) {
		md += `\n\n### Section Contents`;
		md += formatSectionContentsToMarkdown(sectionContents);
	}

	return md;
}

export function formatSetStatusToMarkdown(data: IDataObject): string {
	const responseData = (data.data as IDataObject) || data;
	const deal = (responseData.data as IDataObject) || responseData;
	const dealData = (deal.data as IDataObject) || {};
	const dealId = deal.id as string || (data.deal_id as string);
	const status = dealData.status as string || 'Updated';
	const createdReports = (data.created_reports as IDataObject[]) || [];

	let md = `# Status Updated

- **Deal ID:** ${dealId}
- **New Status:** ${status}
- **Link:** [Open Deal](${getDealUrl(dealId)})`;

	if (createdReports.length > 0) {
		md += `\n\n## Reports Created (${createdReports.length})`;
		for (const report of createdReports) {
			const reportName = report.template_name as string || report.title as string;
			const dashboardId = report.dashboard_id as string;
			md += `\n- **${reportName}** — [Open Report](${getDealUrl(dealId, dashboardId)})`;
		}
	}

	return md;
}

export function formatCreatedActivityToMarkdown(activity: IDataObject): string {
	const title = activity.title as string || 'Untitled';
	const description = activity.description as string || '';
	const dealId = activity.deal_id as string;
	const activityId = activity.id as string;

	let md = `# Activity Created

## ${title}
- **Activity ID:** ${activityId}`;

	if (dealId) {
		md += `\n- **Deal:** [View Deal](${getDealUrl(dealId)})`;
	}

	if (description) {
		md += `\n\n${description}`;
	}

	return md;
}
