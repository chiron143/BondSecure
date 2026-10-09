// Date helpers that work on plain calendar dates (YYYY-MM-DD) in UTC,
// so results never shift with the viewer's time zone.

const DAY_MS = 24 * 60 * 60 * 1000;

export function parseDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  return toIso(new Date(parseDate(iso).getTime() + days * DAY_MS));
}

/**
 * Adds business days, skipping Saturdays and Sundays.
 * NSW public holidays are NOT skipped, so the real deadline can be a day or
 * two later than this. Callers say "about" when showing it.
 */
export function addBusinessDays(iso: string, days: number): string {
  let date = parseDate(iso);
  let added = 0;
  while (added < days) {
    date = new Date(date.getTime() + DAY_MS);
    const dow = date.getUTCDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return toIso(date);
}

export function endOfMonth(iso: string): string {
  const d = parseDate(iso);
  return toIso(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)));
}

/** Whole days from `from` to `to` (positive if `to` is later). */
export function daysBetween(from: string, to: string): number {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / DAY_MS);
}

export function formatDate(iso: string): string {
  return parseDate(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function todayIso(): string {
  // Sydney's calendar date, which is what deadlines are counted in.
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney" }).format(new Date());
}
