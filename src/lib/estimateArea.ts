export function estimateArea(description: string): number | null {
  const text = description.toLowerCase();

  // Habitaciones
  if (text.includes("habitació petita")) return 10;
  if (text.includes("habitació")) return 12;

  // Menjador / sala
  if (text.includes("menjador petit")) return 18;
  if (text.includes("menjador")) return 22;
  if (text.includes("sala")) return 20;

  // Pis complet
  if (text.includes("pis sencer")) return 70;

  return null;
}