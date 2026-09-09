/** Replace the characters that terminate or corrupt a Content-Disposition quoted-string. */
function sanitizeQuotedFileName(value: string): string {
	return Array.from(value, (char) => {
		const code = char.charCodeAt(0);
		const isControl = code <= 0x1f || code === 0x7f;
		return isControl || char === '"' || char === '\\' ? '_' : char;
	}).join('');
}

/** Left raw by `encodeURIComponent` but not RFC 5987 `attr-char`. */
const NOT_ATTR_CHAR = /[!'()*]/g;

/**
 * Percent-encode a name as an RFC 5987 `ext-value`, leaving only unreserved
 * characters raw.
 *
 * `encodeURIComponent` alone is not enough: it keeps `!'()*`, and Werkzeug reads
 * the value with a token pattern that excludes `(` and `)`, so it silently
 * truncates the name at the first parenthesis.
 */
function encodeRfc5987(value: string): string {
	return encodeURIComponent(value).replace(
		NOT_ATTR_CHAR,
		(char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
	);
}

/**
 * Build the Content-Disposition value for the multipart file part.
 *
 * `filename="..."` must not contain raw quotes (Flask/Werkzeug would treat the
 * first `"` as the end of the name and drop the extension). `filename*` carries
 * the original name, including quotes, via RFC 5987.
 */
export function buildFilePartContentDisposition(fileName: string): string {
	const raw = fileName.trim() || 'file';
	const quoted = sanitizeQuotedFileName(raw);
	return `form-data; name="file"; filename="${quoted}"; filename*=UTF-8''${encodeRfc5987(raw)}`;
}
