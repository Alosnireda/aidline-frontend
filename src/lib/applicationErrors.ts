/** Fields of the verifier application form, with their visible labels. */
export const APPLICATION_FIELDS = {
  orgName: 'Organisation',
  country: 'Country',
  website: 'Website',
  description: 'How you verify work on the ground',
} as const;

export type ApplicationField = keyof typeof APPLICATION_FIELDS;

export interface ApplicationErrors {
  /** One sentence per field, written with the field's visible label. */
  fields: Partial<Record<ApplicationField, string>>;
  /** Issues whose path is not a form field, shown in a general message. */
  general: string[];
}

/** Rewrites common validator wording into a sentence that uses `label`. */
function sentence(label: string, message: string): string {
  const min = /at least (\d+) character/i.exec(message);
  if (min) return `${label} must be at least ${min[1]} characters.`;
  const max = /at most (\d+) character/i.exec(message);
  if (max) return `${label} must be at most ${max[1]} characters.`;
  if (/invalid url/i.test(message))
    return `${label} must be a full web address, like https://example.org.`;
  if (/required/i.test(message)) return `${label} is required.`;
  const text = message.trim().replace(/\.$/, '');
  return `${label}: ${text.charAt(0).toLowerCase()}${text.slice(1)}.`;
}

/**
 * Splits API validation issues into per-field messages and a general list.
 * Paths may be nested (`body.orgName`); the last segment names the field.
 */
export function applicationErrors(issues: { path: string; message: string }[]): ApplicationErrors {
  const result: ApplicationErrors = { fields: {}, general: [] };
  for (const issue of issues) {
    const key = String(issue.path).split('.').pop() ?? '';
    if (Object.hasOwn(APPLICATION_FIELDS, key)) {
      const field = key as ApplicationField;
      // Keep the first issue per field: one clear sentence beats a list.
      result.fields[field] ??= sentence(APPLICATION_FIELDS[field], issue.message);
    } else {
      result.general.push(issue.message);
    }
  }
  return result;
}
