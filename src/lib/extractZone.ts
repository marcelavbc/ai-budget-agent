/**
 * Extracts the zone prefix from a budget line label.
 * Labels follow the format "Zone: description", e.g. "Cuina: pintura parets".
 * Returns "Sense zona" when no zone prefix is present.
 */
export function extractZone(label: string): string {
  const parts = label.split(":");
  return parts.length > 1 ? parts[0].trim() : "Sense zona";
}
