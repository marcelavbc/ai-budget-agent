/** Cadena buida = vàlid (camp opcional). */
export function isValidEmail(value: string): boolean {
  const v = value.trim();
  if (v.length === 0) return true;
  // Prou per detectar errors habituals sense ser excessivament estricte
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
