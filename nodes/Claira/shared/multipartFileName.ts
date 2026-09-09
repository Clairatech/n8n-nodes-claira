/** Characters that terminate or corrupt a Content-Disposition quoted-string. */
const QUOTED_FILENAME_UNSAFE = /[\u0000-\u001f\u007f"\\]/g;

/**
 * Build the Content-Disposition value for the multipart file part.
 *
 * `filename="..."` must not contain raw quotes (Flask/Werkzeug would treat the
 * first `"` as the end of the name and drop the extension). `filename*` carries
 * the original name, including quotes, via RFC 5987.
 */
export function buildFilePartContentDisposition(fileName: string): string {
	const raw = fileName.trim() || 'file';
	const quoted = raw.replace(QUOTED_FILENAME_UNSAFE, '_');
	return `form-data; name="file"; filename="${quoted}"; filename*=UTF-8''${encodeURIComponent(raw)}`;
}
