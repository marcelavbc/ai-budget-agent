/** `year` absent = all years (still combinable with `months`). */
export type DateFilter = { year?: number; months?: number[] } | null;

type SearchParamValue = string | string[] | undefined;

function firstParam(value: SearchParamValue): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseIntSafe(v: string | undefined): number | null {
  if (!v) return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

function isValidYear(year: number): boolean {
  return year >= 1970 && year <= 2100;
}

function isValidMonth(month: number): boolean {
  return month >= 1 && month <= 12;
}

/**
 * Parses URL search params (`?month=1&month=3&year=2026`) into a DateFilter.
 * - No `year` and no `month`: no filter (all time)
 * - Only `year`: that calendar year
 * - Only `month` (repeatable): those months across **all** years
 * - Both: those months inside that year
 */
export function parseDateFilter(params: {
  month?: SearchParamValue;
  year?: SearchParamValue;
}): DateFilter {
  const yearRaw = firstParam(params.year);

  const yearParsedRaw = parseIntSafe(yearRaw);
  const nowYear = new Date().getFullYear();

  let yearParsed = yearParsedRaw;
  if (yearParsed != null) {
    if (!isValidYear(yearParsed)) yearParsed = null;
    else if (yearParsed > nowYear) yearParsed = nowYear;
  }

  const monthValues = (() => {
    const raw = params.month;
    const arr = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : [];
    const out = arr
      .map((v) => parseIntSafe(v))
      .filter((n): n is number => typeof n === "number")
      .filter((n) => isValidMonth(n));
    return [...new Set(out)].sort((a, b) => a - b);
  })();

  if (monthValues.length === 0 && yearParsed == null) return null;

  if (monthValues.length === 0) {
    if (yearParsed != null && !isValidYear(yearParsed)) return null;
    if (yearParsed == null) return null;
    return { year: yearParsed };
  }

  if (yearParsed == null) {
    return { months: monthValues };
  }

  if (!isValidYear(yearParsed)) {
    return { months: monthValues };
  }

  return { year: yearParsed, months: monthValues };
}

/**
 * Produces an inclusive [gte, lte] range suitable for `.gte(...).lte(...)`.
 * Uses UTC boundaries to be stable across server timezones.
 *
 * Note: if `months` is present, this returns the whole-year range; callers
 * can apply month filtering in-memory to stay compatible with Supabase query
 * capabilities.
 */
export function dateFilterRange(
  f: DateFilter
): { gte: string; lte: string } | null {
  if (!f) return null;

  const year = f.year;
  if (typeof year !== "number" || !isValidYear(year)) return null;

  const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
  return { gte: start.toISOString(), lte: end.toISOString() };
}

export function matchesDateFilter(createdAt: string | null, f: DateFilter): boolean {
  if (!f) return true;

  const months = f.months ?? [];
  const hasMonths = months.length > 0;
  const hasYear = typeof f.year === "number";

  if (!hasYear && !hasMonths) return true;

  if (!createdAt) return false;
  const dt = new Date(createdAt);
  if (Number.isNaN(dt.getTime())) return false;

  if (hasYear && dt.getUTCFullYear() !== f.year) return false;

  if (!hasMonths) return true;
  const month = dt.getUTCMonth() + 1;
  return months.includes(month);
}

