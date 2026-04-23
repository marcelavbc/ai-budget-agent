/** Empty string is valid (optional field). */
export function isValidEmail(value: string): boolean {
  const v = value.trim();
  if (v.length === 0) return true;
  // Intentionally permissive: catches common mistakes without being overly strict.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
