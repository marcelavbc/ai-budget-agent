import { lineTemplates } from "@/lib/lineTemplates";
import type { AIParsedLine } from "@/types/aiBudget";
import type { BudgetLine, BudgetLineUnit } from "@/types/budget";

export function hydrateBudgetLines(aiLines: AIParsedLine[]): BudgetLine[] {
  const normalizedBaseLines = aiLines.map((line, index) => {
    const normalizedType = normalizeType(line.type, line.label);
    const template = lineTemplates[normalizedType] ?? lineTemplates.custom;

    const unitLabel = normalizeUnitLabel(line.unitLabel, template.unitLabel);
    const unitMismatch = unitLabel !== template.unitLabel;

    const rawQuantity = line.quantity ?? getDefaultQuantity(unitLabel);
    const quantity = normalizeQuantity(normalizedType, unitLabel, rawQuantity);

    const label = getNormalizedLabel(line.label, template.label);

    return {
      id: `${normalizedType}-${index}-${crypto.randomUUID()}`,
      type: normalizedType,
      label,
      quantity,
      unitLabel,
      unitPrice: unitMismatch ? 0 : template.defaultPrice,
      subtotal: 0,
      pricingMode: unitMismatch ? "input" : template.pricingMode,
    };
  });

  const wallsLine = normalizedBaseLines.find(
    (line) =>
      line.type === "walls_and_ceilings" &&
      line.unitLabel === "m²" &&
      line.quantity > 0
  );

  const completedLines = normalizedBaseLines.map((line) => {
    let quantity = line.quantity;

    if (
      line.type === "repair" &&
      line.unitLabel === "m²" &&
      quantity === 0 &&
      wallsLine
    ) {
      quantity = wallsLine.quantity;
    }

    return {
      ...line,
      quantity,
      subtotal: quantity * line.unitPrice,
    };
  });

  const cleanedLines = removeNoisyDuplicateLines(completedLines);
  return cleanedLines;
}

function removeNoisyDuplicateLines(lines: BudgetLine[]): BudgetLine[] {
  const hasMainWallsLine = lines.some(
    (line) =>
      line.type === "walls_and_ceilings" &&
      line.unitLabel === "m²" &&
      line.quantity > 0
  );

  return lines.filter((line) => {
    if (
      hasMainWallsLine &&
      line.type === "walls_and_ceilings" &&
      line.unitLabel === "partida" &&
      line.quantity > 0 &&
      line.quantity <= 3
    ) {
      return false;
    }

    return true;
  });
}

function normalizeType(
  type: BudgetLine["type"],
  label: string
): BudgetLine["type"] {
  const text = label.toLowerCase();

  if (
    text.includes("terra") ||
    text.includes("sòl") ||
    text.includes("suelo") ||
    text.includes("pàrquing") ||
    text.includes("parking")
  ) {
    return "custom";
  }

  return type;
}

function normalizeUnitLabel(
  unitLabel: BudgetLineUnit | null | undefined,
  fallback: BudgetLineUnit
): BudgetLineUnit {
  if (unitLabel === "m²" || unitLabel === "unitat" || unitLabel === "partida") {
    return unitLabel;
  }

  return fallback;
}

function normalizeQuantity(
  type: BudgetLine["type"],
  unitLabel: BudgetLineUnit,
  quantity: number
): number {
  if (type === "walls_and_ceilings" && unitLabel === "m²") {
    return quantity * 3;
  }

  return quantity;
}

function getDefaultQuantity(unitLabel: BudgetLineUnit): number {
  if (unitLabel === "partida") return 1;
  return 0;
}

function getNormalizedLabel(aiLabel: string, fallback: string): string {
  const cleaned = aiLabel?.trim();
  return cleaned || fallback;
}
