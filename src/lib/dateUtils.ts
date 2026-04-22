import { parseISO, isValid } from 'date-fns';

export function safeParseDate(dateStr: string | undefined | null): Date | null {
  if (!dateStr) return null;
  const date = parseISO(dateStr);
  return isValid(date) ? date : null;
}

export function safeGetTime(dateStr: string | undefined | null): number {
  const date = safeParseDate(dateStr);
  return date ? date.getTime() : 0;
}
