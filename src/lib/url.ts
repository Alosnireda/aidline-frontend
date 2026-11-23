/**
 * Returns `value` only when it is an absolute URL with the http: or https:
 * protocol. Anything else (javascript:, data:, relative paths, garbage)
 * returns null, so user supplied links can never run script when clicked.
 */
export function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
}
