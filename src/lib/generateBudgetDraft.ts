import type {
  BudgetLine,
  BudgetListItem,
  BudgetClientItem,
} from "@/types/budget";
import { isBudgetOptionGroup, templateGroup } from "@/types/budget";

function getTemplateDescription(zone: string, lines: BudgetLine[]): string {
  const colorMatch = lines
    .map((l) => l.label.match(/\b(blanc|negre|gris|verd|blau|beige|crema)\b/i))
    .find(Boolean);
  const color = colorMatch ? colorMatch[0] : "a escollir";

  switch (zone) {
    case "interior":
      return `Protecció de totes les superfícies i objectes susceptibles a ser tacats, reparació dels desperfectes mitjançant massilla i acabat amb pintura plàstica Jotun Jotaprof Supermate en color ${color}.`;
    case "exterior":
      return `Sanejat de la superficie, aplicació de fons fixador Isaval Fixenol i acabat amb dues capes de revestiment per exteriors d'alta qualitat a base de resina de silicona Isaval Bixolan en un color a escollir.`;
    case "openings":
      return `Polit i neteja de la superficie i acabat amb esmalt Titanlux Ecològic en color a escollir.`;
    case "enamel":
      return `Polit i neteja de la superficie, aplicació d'imprimació antioxidant de la marca Isaval i acabat amb esmalt sintètic Jotun Jotaprof en color a escollir.`;
    default:
      return "";
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
        description: getTemplateDescription(templateGroup[opt.type], [opt]),
        total: opt.subtotal,
        quantity: opt.quantity,
        unitLabel: opt.unitLabel,
        unitPrice: opt.unitPrice,
        optionGroupId: item.id,
        optionLabel: opt.optionLabel,
      }));
    }

    const line = item as BudgetLine;
    return [
      {
        id: line.id,
        title: line.label,
        description: getTemplateDescription(templateGroup[line.type], [line]),
        total: line.subtotal,
        quantity: line.quantity,
        unitLabel: line.unitLabel,
        unitPrice: line.unitPrice,
      },
    ];
  });
}
