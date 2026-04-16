import type { BudgetLineType, BudgetLineUnit } from "@/types/budget";

export interface AIParsedLine {
  type: BudgetLineType;
  label: string;
  quantity: number | null;
  unitLabel: BudgetLineUnit;
}

export interface AIParsedBudgetLines {
  lines: AIParsedLine[];
}
