export function extractExcludedArea(description: string): number {
  const text = description.toLowerCase();

  const matches = [...text.matchAll(/(\d+)\s?(m2|m²)/g)];

  if (matches.length <= 1) return 0;

  const values = matches.map((m) => Number(m[1]));

  const [, ...excluded] = values;

  return excluded.reduce((acc, val) => acc + val, 0);
}