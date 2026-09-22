/** Email wrappers, images, and other non-document attachments the email agent should not upload. */
const SKIPPABLE_EXTENSIONS = new Set([
	'bin',
	'bmp',
	'eml',
	'emlx',
	'gif',
	'heic',
	'heif',
	'ico',
	'ics',
	'jpeg',
	'jpg',
	'mail',
	'mime',
	'msg',
	'oft',
	'png',
	'svg',
	'tif',
	'tiff',
	'vcf',
	'webp',
]);

export function getUploadFileExtension(fileName?: string, fileExtension?: string): string {
	if (fileExtension && fileExtension.trim()) {
		return fileExtension.replace(/^\./, '').toLowerCase();
	}

	if (!fileName) {
		return '';
	}

	const lastDot = fileName.lastIndexOf('.');
	if (lastDot === -1 || lastDot === fileName.length - 1) {
		return '';
	}

	return fileName.slice(lastDot + 1).toLowerCase();
}

export function isSkippableNonDocumentUpload(input: {
	fileName?: string;
	fileExtension?: string;
	mimeType?: string;
}): boolean {
	const extension = getUploadFileExtension(input.fileName, input.fileExtension);
	if (extension && SKIPPABLE_EXTENSIONS.has(extension)) {
		return true;
	}

	const mimeType = (input.mimeType || '').toLowerCase();
	return mimeType === 'message/rfc822' || mimeType.startsWith('message/');
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
	if (value && typeof value === 'object' && !Array.isArray(value)) {
		return value as Record<string, unknown>;
	}
	return undefined;
}

function nestedError(errorResponse: unknown): Record<string, unknown> | undefined {
	const root = asRecord(errorResponse);
	return asRecord(root?.error);
}

export function extractClairaErrorMessage(errorResponse: unknown): string {
	if (typeof errorResponse === 'string') {
		const trimmed = errorResponse.trim();
		if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
			try {
				return extractClairaErrorMessage(JSON.parse(trimmed));
			} catch {
				return errorResponse;
			}
		}
		return errorResponse;
	}

	const nested = nestedError(errorResponse);
	if (typeof nested?.msg === 'string' && nested.msg) {
		return nested.msg;
	}
	if (typeof nested?.message === 'string' && nested.message) {
		return nested.message;
	}

	const root = asRecord(errorResponse);
	if (typeof root?.message === 'string' && root.message) {
		return root.message;
	}
	if (typeof root?.msg === 'string' && root.msg) {
		return root.msg;
	}
	if (typeof root?.detail === 'string' && root.detail) {
		return root.detail;
	}
	if (typeof root?.description === 'string' && root.description) {
		return root.description;
	}
	if (typeof root?.error === 'string' && root.error) {
		return root.error;
	}

	if (Array.isArray(root?.file) && typeof root.file[0] === 'string') {
		return root.file[0];
	}
	if (typeof root?.file === 'string' && root.file) {
		return root.file;
	}

	if (errorResponse === undefined || errorResponse === null) {
		return 'Unknown error';
	}

	return JSON.stringify(errorResponse);
}

export function isUnsupportedExtensionError(errorResponse: unknown): boolean {
	const nested = nestedError(errorResponse);
	const message = extractClairaErrorMessage(errorResponse);
	const code = nested?.code;
	return code === 'FILE_ERROR' && message.toLowerCase().includes('extension is not supported');
}
