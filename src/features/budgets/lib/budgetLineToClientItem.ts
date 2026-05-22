import type { BudgetClientItem, BudgetLine } from "@/features/budgets/types/budget";

function defaultDescriptionForType(type: BudgetLine["type"]): string {
  switch (type) {
    case "walls_and_ceilings":
      return "Protecció d’elements, preparació de superfícies i pintura plàstica (2 mans) segons necessitat.";
    case "repair":
      return "Preparació de la zona amb massilla, repàs i polit per deixar la superfície llesta per pintar.";
    case "doors":
      return "Preparació, neteja/llixat i esmaltat de portes (2 mans) amb materials de qualitat professional.";
    case "windows":
      return "Preparació, protecció i esmaltat de finestres/marcs (2 mans) amb materials de qualitat professional.";
    case "enamel_varnish":
      return "Preparació de superfícies i aplicació d’esmalt o vernís segons suport i acabat desitjat.";
    case "exterior":
      return "Preparació de superfícies i pintura exterior amb acabat i protecció adequats.";
    case "custom":
      return "Segons treball indicat.";
  }
}

export function budgetLinesToClientItems(lines: BudgetLine[]): BudgetClientItem[] {
  return lines.map((line) => ({
    id: line.id,
    title: line.label,
    description: defaultDescriptionForType(line.type),
    quantity: line.quantity,
    unitLabel: line.unitLabel,
    unitPrice: line.unitPrice,
    total: line.subtotal,
    lineType: line.type,
  }));
}

