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

// response from API to FE
export interface BudgetResponse {
  parsedJob: ParsedJob;
  breakdown: BudgetBreakdown | null;
  budgetText: string;
  errors?: string[];
}
