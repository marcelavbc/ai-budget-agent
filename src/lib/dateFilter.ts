export type DateFilter = { months?: number[]; year: number } | null;

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
 * - If only `year` is present: filters the whole year
 * - If `month` is present without `year`: defaults to the current year
 */
export function parseDateFilter(params: {
  month?: SearchParamValue;
  year?: SearchParamValue;
}): DateFilter {
  const yearRaw = firstParam(params.year);

  const year = parseIntSafe(yearRaw);

  const nowYear = new Date().getFullYear();

  const monthValues = (() => {
    const raw = params.month;
    const arr = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : [];
    const out = arr
      .map((v) => parseIntSafe(v))
      .filter((n): n is number => typeof n === "number")
      .filter((n) => isValidMonth(n));
    return [...new Set(out)].sort((a, b) => a - b);
  })();

  if (monthValues.length === 0 && year == null) return null;

  const resolvedYear = year ?? (monthValues.length ? nowYear : null);
  if (resolvedYear == null || !isValidYear(resolvedYear)) return null;

  if (monthValues.length === 0) return { year: resolvedYear };
  return { year: resolvedYear, months: monthValues };
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
  if (!isValidYear(year)) return null;

  const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
  return { gte: start.toISOString(), lte: end.toISOString() };
}

export function matchesDateFilter(createdAt: string | null, f: DateFilter): boolean {
  if (!f) return true;
  const months = f.months ?? [];
  if (months.length === 0) return true;
  if (!createdAt) return false;
  const dt = new Date(createdAt);
  if (Number.isNaN(dt.getTime())) return false;
  const month = dt.getUTCMonth() + 1;
  return months.includes(month);
}

