/**
 * Helpers that keep the start form's error handling accessible without
 * repeating aria wiring at every field (#99) and locate the field to focus when
 * a submit fails (#100).
 */

export type FieldA11yProps = {
  'aria-invalid'?: true;
  'aria-describedby'?: string;
};

/** Id of the error message rendered under `key`. */
export function fieldErrorId(key: string): string {
  return `${key}-error`;
}

/** Id of the persistent hint rendered under `key`. */
export function fieldHintId(key: string): string {
  return `${key}-hint`;
}

/**
 * DOM id of the control that owns an error key. Milestone amounts use `m0`,
 * `m1`, … so they can share the `errors` map with plain fields.
 */
export function errorFieldId(key: string): string {
  const milestone = /^m(\d+)$/.exec(key);
  if (milestone) return `milestone-${milestone[1]}`;
  const due = /^md(\d+)$/.exec(key);
  if (due) return `milestone-due-${due[1]}`;
  return key;
}

/**
 * Aria attributes for a field: invalid + linked error when it has one, the hint
 * when it does not.
 */
export function fieldA11y(
  key: string,
  errors: Record<string, string>,
  hintId?: string,
): FieldA11yProps {
  if (errors[key]) {
    return { 'aria-invalid': true, 'aria-describedby': fieldErrorId(key) };
  }
  return hintId ? { 'aria-describedby': hintId } : {};
}

/** Short announcement for the live region after a failed submit. */
export function errorSummary(count: number): string {
  if (count <= 0) return '';
  return count === 1 ? '1 field needs attention' : `${count} fields need attention`;
}
