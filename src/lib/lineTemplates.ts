import type {
  BudgetLinePricingMode,
  BudgetLineType,
  BudgetLineUnit,
} from "@/types/budget";

export interface LineTemplate {
  type: BudgetLineType;
  label: string;
  unitLabel: BudgetLineUnit;
  defaultPrice: number;
  pricingMode: BudgetLinePricingMode;
}

export const lineTemplates: Record<BudgetLineType, LineTemplate> = {
  walls_and_ceilings: {
    type: "walls_and_ceilings",
    label: "Pintura de parets i sostres",
    unitLabel: "m²",
    defaultPrice: 12,
    pricingMode: "range",
  },
  repair: {
    type: "repair",
    label: "Reparació de desperfectes",
    unitLabel: "m²",
    defaultPrice: 4,
    pricingMode: "range",
  },
  doors: {
    type: "doors",
    label: "Pintura de portes",
    unitLabel: "unitat",
    defaultPrice: 30,
    pricingMode: "input",
  },
  custom: {
    type: "custom",
    label: "Partida especial",
    unitLabel: "partida",
    defaultPrice: 0,
    pricingMode: "input",
  },
};
