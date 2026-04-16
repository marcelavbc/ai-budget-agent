export type WallCondition = "good" | "medium" | "bad";

export interface BudgetRequest {
  description: string;
}

export interface ParsedJob {
  jobType: "interior_painting";
  areaM2: number | null;
  color: string | null;
  wallCondition: WallCondition | null;
}

export interface BudgetBreakdown {
  pricePerM2: number;
  paintableSurfaceM2: number;
  paintingCost: number;
  total: number;
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

export interface BudgetResponse {
  parsedJob: ParsedJob;
  breakdown: BudgetBreakdown | null;
  lines: BudgetLine[];
  total: number | null;
  budgetText: string;
  errors?: string[];
}
