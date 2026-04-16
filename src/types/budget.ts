export type WallCondition = "good" | "medium" | "bad";

// send from FE
export interface BudgetRequest {
  description: string;
}

// parsed from description
export interface ParsedJob {
  jobType: "interior_painting";
  areaM2: number | null;
  color: string | null;
  wallCondition: WallCondition | null;
}

// calculated from parsed job
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
  | "custom";

export type BudgetLineUnit = "m²" | "unitat" | "partida";

export type BudgetLinePricingMode = "range" | "input";

// each line of the breakdown
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

// response from API to FE
export interface BudgetResponse {
  parsedJob: ParsedJob;
  breakdown: BudgetBreakdown | null;
  lines: BudgetLine[];
  total: number | null;
  budgetText: string;
  errors?: string[];
}
