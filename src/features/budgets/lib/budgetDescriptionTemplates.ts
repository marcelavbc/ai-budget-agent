import type { BudgetLine } from "@/features/budgets/types/budget";
import { templateGroup } from "@/features/budgets/types/budget";

function clientDescriptionFromLines(lines: BudgetLine[]): string {
  const clientDescription = lines.find(
    (l) => l.clientDescription != null && l.clientDescription.trim().length > 0
  )?.clientDescription;
  return clientDescription?.trim() ?? "";
}

export function templateZone(line: BudgetLine): string {
  return line.type === "repair" ? "repair" : templateGroup[line.type];
}

export function getTemplateDescription(
  zone: string,
  lines: BudgetLine[]
): string {
  const colorMatch = lines
    .flatMap((l) => [
      l.label.match(/\b(blanc|negre|gris|verd|blau|beige|crema)\b/i),
      (l.clientDescription ?? "").match(
        /\b(blanc|negre|gris|verd|blau|beige|crema)\b/i
      ),
    ])
    .find(Boolean);
  const color = colorMatch ? colorMatch[0] : "a escollir";

  switch (zone) {
    case "repair":
      return clientDescriptionFromLines(lines);
    case "interior":
      return `Protecció de totes les superfícies i objectes susceptibles a ser tacats, reparació dels desperfectes mitjançant massilla i acabat amb pintura plàstica Jotun Jotaprof Supermate en color ${color}.`;
    case "exterior":
      return `Sanejat de la superficie, aplicació de fons fixador Isaval Fixenol i acabat amb dues capes de revestiment per exteriors d'alta qualitat a base de resina de silicona Isaval Bixolan en un color a escollir.`;
    case "openings":
      return `Polit i neteja de la superficie i acabat amb esmalt Titanlux Ecològic en color a escollir.`;
    case "enamel":
      return `Polit i neteja de la superficie, aplicació d'imprimació antioxidant de la marca Isaval i acabat amb esmalt sintètic Jotun Jotaprof en color a escollir.`;
    default:
      return clientDescriptionFromLines(lines);
  }
}
