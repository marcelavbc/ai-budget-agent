export interface BudgetRequest {
  description: string;
}

export type BudgetLineType =
  | "walls_and_ceilings"
  | "repair"
  | "doors"
  | "windows"
  | "enamel_varnish"
  | "exterior"
  | "custom";

export type BudgetLineUnit = "m²" | "unitat" | "partida";

export type BudgetLinePricingMode = "range" | "input";

export interface BudgetLine {
  id: string;
  type: BudgetLineType;
  label: string;
  quantity: number;
  unitLabel: BudgetLineUnit;
  unitPrice: number;
  subtotal: number;
  pricingMode: BudgetLinePricingMode;
}

export interface BudgetDraftResponse {
  lines: BudgetLine[];
  total: number | null;
  errors?: string[];
}

export interface BudgetGroup {
  id: string;
  zone: string;
  lines: BudgetLine[];
  subtotal: number;
}

export type BudgetListItem = BudgetLine | BudgetGroup;

export function isBudgetGroup(item: BudgetListItem): item is BudgetGroup {
  return "zone" in item && "lines" in item;
}
