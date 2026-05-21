import type {
  BudgetLine,
  BudgetListItem,
  BudgetClientItem,
} from "@/features/budgets/types/budget";
import { isBudgetOptionGroup, templateGroup } from "@/features/budgets/types/budget";

function clientDescriptionFromLines(lines: BudgetLine[]): string {
  const clientDescription = lines.find(
    (l) => l.clientDescription != null && l.clientDescription.trim().length > 0
  )?.clientDescription;
  return clientDescription?.trim() ?? "";
}

function templateZone(line: BudgetLine): string {
  return line.type === "repair" ? "repair" : templateGroup[line.type];
}

function getTemplateDescription(zone: string, lines: BudgetLine[]): string {
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

export function generateBudgetDraft(
  items: BudgetListItem[]
): BudgetClientItem[] {
  return items.flatMap((item): BudgetClientItem[] => {
    if (isBudgetOptionGroup(item)) {
      return item.options.map((opt) => ({
        id: opt.id,
        title: opt.label,
        description: getTemplateDescription(templateZone(opt), [opt]),
        total: opt.subtotal,
        quantity: opt.quantity,
        unitLabel: opt.unitLabel,
        unitPrice: opt.unitPrice,
        optionGroupId: item.id,
        optionLabel: opt.optionLabel,
        clientDescription: opt.clientDescription,
      }));
    }

    const line = item as BudgetLine;
    return [
      {
        id: line.id,
        title: line.label,
        description: getTemplateDescription(templateZone(line), [line]),
        total: line.subtotal,
        quantity: line.quantity,
        unitLabel: line.unitLabel,
        unitPrice: line.unitPrice,
        clientDescription: line.clientDescription,
      },
    ];
  });
}
