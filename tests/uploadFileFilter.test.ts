/* eslint-disable @n8n/community-nodes/no-restricted-imports */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
	extractClairaErrorMessage,
	getUploadFileExtension,
	isSkippableNonDocumentUpload,
	isUnsupportedExtensionError,
} from '../nodes/Claira/shared/uploadFileFilter';

describe('getUploadFileExtension', () => {
	it('prefers the explicit n8n fileExtension', () => {
		assert.equal(getUploadFileExtension('report.pdf', 'PDF'), 'pdf');
	});

	it('reads the extension from the file name', () => {
		assert.equal(getUploadFileExtension('Q1 Update.mail'), 'mail');
	});

	it('handles a leading-dot file name', () => {
		assert.equal(getUploadFileExtension('.mail'), 'mail');
	});

	it('returns empty when there is no extension', () => {
		assert.equal(getUploadFileExtension('README'), '');
	});
});

describe('isSkippableNonDocumentUpload', () => {
	it('skips .mail attachments that fail Claira upload', () => {
		assert.equal(
			isSkippableNonDocumentUpload({ fileName: 'Forwarded message.mail', fileExtension: 'mail' }),
			true,
		);
	});

	it('skips message/rfc822 even when the name has no extension', () => {
		assert.equal(
			isSkippableNonDocumentUpload({
				fileName: 'attached-email',
				mimeType: 'message/rfc822',
			}),
			true,
		);
	});

	it('does not skip real deal documents', () => {
		assert.equal(
			isSkippableNonDocumentUpload({ fileName: 'CIM.pdf', fileExtension: 'pdf' }),
			false,
		);
		assert.equal(
			isSkippableNonDocumentUpload({ fileName: 'model.xlsx', fileExtension: 'xlsx' }),
			false,
		);
		assert.equal(
			isSkippableNonDocumentUpload({ fileName: 'Email subject: Deal.html', fileExtension: 'html' }),
			false,
		);
	});
});

describe('extractClairaErrorMessage', () => {
	it('reads Flask { error: { code, msg } } instead of stringifying the object', () => {
		assert.equal(
			extractClairaErrorMessage({
				error: { code: 'FILE_ERROR', msg: '`mail` extension is not supported.' },
			}),
			'`mail` extension is not supported.',
		);
	});

	it('does not return [object Object] for a nested error object', () => {
		const message = extractClairaErrorMessage({
			error: { code: 'FILE_ERROR', msg: '`mail` extension is not supported.' },
		});
		assert.equal(message.includes('[object Object]'), false);
	});
});

describe('isUnsupportedExtensionError', () => {
	it('detects FILE_ERROR unsupported-extension responses', () => {
		assert.equal(
			isUnsupportedExtensionError({
				error: { code: 'FILE_ERROR', msg: '`mail` extension is not supported.' },
			}),
			true,
		);
	});

	it('does not treat other API errors as skippable', () => {
		assert.equal(
			isUnsupportedExtensionError({
				error: { code: 'DEAL_NOT_FOUND', msg: 'Deal is not found' },
			}),
			false,
		);
	});
});
