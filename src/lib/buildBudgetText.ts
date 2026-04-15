import type { BudgetBreakdown, ParsedJob } from "@/types/budget";

export function buildBudgetText(
  parsedJob: ParsedJob,
  breakdown: BudgetBreakdown | null,
): string {
  if (!breakdown) {
    return "No hi ha prou informació per generar el pressupost. Si us plau, indica els metres quadrats i l'estat de les parets.";
  }

  const colorText = parsedJob.color ? ` en color ${parsedJob.color}` : "";

  return [
    `Pressupost de pintura`,
    ``,
    `Treball: Pintura interior${colorText}`,
    `Superfície: ${parsedJob.areaM2} m²`,
    `Estat de les parets: ${translateCondition(parsedJob.wallCondition)}`,
    ``,
    `Desglossament:`,
    `- Cost desplaçament: ${breakdown.baseVisitCost}€`,
    `- Preu per m²: ${breakdown.pricePerM2}€`,
    `- Multiplicador estat: ${breakdown.conditionMultiplier}`,
    `- Cost pintura: ${breakdown.paintingCost}€`,
    ``,
    `Total estimat: ${breakdown.total}€`,
  ].join("\n");
}

function translateCondition(condition: ParsedJob["wallCondition"]) {
  switch (condition) {
    case "good":
      return "bon estat";
    case "medium":
      return "estat mitjà";
    case "bad":
      return "mal estat";
    default:
      return "-";
  }
}
