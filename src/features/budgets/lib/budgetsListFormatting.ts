export function formatBudgetListDate(value: string | null) {
  const v = (value ?? "").trim();
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return v;
  const [, yyyy, mm, dd] = m;
  return `${dd}-${mm}-${yyyy.slice(2)}`;
}

export function toComparableBudgetListDate(value: string | null): string | null {
  const v = (value ?? "").trim();
  if (!v) return null;
  // Expect YYYY-MM-DD; keep lexicographic compare possible.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

