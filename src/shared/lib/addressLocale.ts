/**
 * Pairs of [spanish, catalan] street type names, sorted by descending source
 * length so multi-word types (e.g. "gran via") are tested before shorter ones.
 */
const STREET_PAIRS: Array<[es: string, ca: string]> = [
  ["gran via", "gran via"],
  ["urbanización", "urbanització"],
  ["avenida", "avinguda"],
  ["paseo", "passeig"],
  ["travesera", "travessera"],
  ["bulevar", "bulevard"],
  ["plaza", "plaça"],
  ["calle", "carrer"],
  ["camino", "camí"],
  ["barrio", "barri"],
  ["ronda", "ronda"],
  ["vía", "via"],
];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Preserve the capitalisation style of the original word. */
function preserveCase(original: string, replacement: string): string {
  if (original === original.toUpperCase()) return replacement.toUpperCase();
  if (original.length > 0 && original[0] === original[0].toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

function localizeLine(line: string, lang: "ca" | "es"): string {
  const trimmed = line.trimStart();
  const leadingSpace = line.slice(0, line.length - trimmed.length);

  // Sort by descending length of the source token for this language so
  // "gran via" is tried before "via".
  const sorted = [...STREET_PAIRS].sort((a, b) => {
    const aLen = lang === "ca" ? a[0].length : a[1].length;
    const bLen = lang === "ca" ? b[0].length : b[1].length;
    return bLen - aLen;
  });

  for (const [es, ca] of sorted) {
    const source = lang === "ca" ? es : ca;
    const target = lang === "ca" ? ca : es;
    if (source === target) continue; // no translation needed

    const pattern = new RegExp(`^${escapeRegex(source)}(?=\\s|,|$)`, "i");
    const match = pattern.exec(trimmed);
    if (match) {
      const replacement = preserveCase(match[0], target);
      return leadingSpace + replacement + trimmed.slice(match[0].length);
    }
  }

  return line;
}

/**
 * Translate street type names in a free-text address to the target language.
 * Handles multi-line addresses (newline-separated).
 */
export function localizeAddress(address: string, lang: "ca" | "es"): string {
  return address
    .split("\n")
    .map((line) => localizeLine(line, lang))
    .join("\n");
}
