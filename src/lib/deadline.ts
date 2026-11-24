const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (value: number) => String(value).padStart(2, '0');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const offsetFor = (date: Date, offsetMinutes?: number) => offsetMinutes ?? date.getTimezoneOffset();

const localInstant = (date: Date, offsetMinutes?: number) =>
  new Date(date.getTime() - offsetFor(date, offsetMinutes) * 60_000);

export function localDate(date: Date = new Date(), offsetMinutes?: number): string {
  const local = localInstant(date, offsetMinutes);
  return `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}`;
}

export function addDays(date: string, days: number): string {
  const match = DATE_PATTERN.exec(date);
  if (!match) return date;
  const [, year, month, day] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day) + days))
    .toISOString()
    .slice(0, 10);
}

export function minimumDeadline(date: Date = new Date(), offsetMinutes?: number): string {
  return addDays(localDate(date, offsetMinutes), 1);
}

export function defaultDeadline(date: Date = new Date(), offsetMinutes?: number): string {
  return addDays(localDate(date, offsetMinutes), 30);
}

export function deadlineEndUtc(date: string): Date {
  return new Date(`${date}T23:59:59Z`);
}

export function deadlineHint(date: string, offsetMinutes?: number): string {
  if (!DATE_PATTERN.test(date)) return '';
  const end = deadlineEndUtc(date);
  const local = localInstant(end, offsetMinutes);
  const label = `${WEEKDAYS[local.getUTCDay()]}, ${MONTHS[local.getUTCMonth()]} ${local.getUTCDate()}, ${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}`;
  return `The campaign ends at 23:59 UTC on the chosen day (${label} in your time zone).`;
}
