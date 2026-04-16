import type { BudgetBreakdown, ParsedJob } from "@/types/budget";

export function buildBudgetText(
  parsedJob: ParsedJob,
  breakdown: BudgetBreakdown | null
): string {
  if (!breakdown) {
    return "No hi ha prou informació per calcular el pressupost. Si us plau, indica els metres quadrats.";
  }

  const colorText = parsedJob.color
    ? `en color ${parsedJob.color}`
    : "en color a escollir";

  const estimatedDays = estimateWorkingDays(breakdown.paintableSurfaceM2);

  return [
    "PRESSUPOST",
    "",
    "Pressupost per a les feines de pintura interior a realitzar.",
    "",
    "CONDICIONS GENERALS",
    "1. Aquest pressupost cobreix totes les partides especificades en el mateix.",
    "2. Si durant l’execució de l’obra apareixen partides no previstes, es facturaran a part.",
    "3. Tots els repassos no imputables al pintor aniran a càrrec del client.",
    "",
    "MATERIALS",
    "Els materials utilitzats seran de primeres marques i qualitat professional.",
    "",
    "TEMPS",
    `El temps estimat d’execució serà d’uns ${estimatedDays}.`,
    "",
    "INTERVENCIÓ",
    "Parets i sostres interiors:",
    `- Protecció de totes les superfícies i objectes susceptibles a ser tacats, reparació dels desperfectes mitjançant massilla i acabat amb pintura plàstica ${colorText}.`,
    "",
    `IMPORT TOTAL: ${breakdown.total} €`,
    "",
    "FORMA DE PAGAMENT",
    "40% a l’inici de les feines.",
    "60% al finalitzar les feines.",
    "",
    "Aquest pressupost no inclou l’IVA i té una validesa de tres mesos des de la data d’emissió.",
  ].join("\n");
}

function estimateWorkingDays(paintableSurfaceM2: number): string {
  if (paintableSurfaceM2 <= 60) return "2 o 3 dies hàbils";
  if (paintableSurfaceM2 <= 120) return "3 o 4 dies hàbils";
  if (paintableSurfaceM2 <= 200) return "4 o 5 dies hàbils";
  return "5 o 6 dies hàbils";
}
