import type { BudgetLineType, BudgetLineUnit } from "@/features/budgets/types/budget";

export interface AIParsedLine {
  type: BudgetLineType;
  label: string;
  quantity: number | null;
  unitLabel: BudgetLineUnit;
  optionGroupId?: string;
  optionLabel?: string;
  clientDescription: string;
}

export interface AIParsedBudgetLines {
  lines: AIParsedLine[];
}
