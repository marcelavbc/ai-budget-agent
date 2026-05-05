/**
 * Generates a quote number in the form INITIALS-YYYYMMDD (based on the date field).
 * Falls back to the prefix PRE when a name does not yield valid initials.
 */
export function deriveInitialsFromName(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0)
    .slice(0, 3);

  if (parts.length === 0) return "PRE";

  const initials = parts
    .map((word) => {
      for (const ch of word) {
        if (/\p{L}/u.test(ch)) return ch.toUpperCase();
      }
      return "";
    })
    .filter(Boolean)
    .join("");

  return initials.length > 0 ? initials : "PRE";
}

export function buildAutoQuoteNumber(
  nameOrCompany: string,
  isoDate: string,
): string {
  const initials = deriveInitialsFromName(nameOrCompany);
  const compact = isoDate.replace(/-/g, "");
  return `${initials}-${compact}`;
}
