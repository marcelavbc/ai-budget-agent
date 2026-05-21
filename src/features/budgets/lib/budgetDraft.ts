import type {
  BudgetClientDetails,
  BudgetClientItem,
} from "@/features/budgets/types/budget";

export interface BudgetDraftSnapshot {
  client: BudgetClientDetails;
  items: BudgetClientItem[];
}

export function isBudgetDraftComplete({
  client,
}: BudgetDraftSnapshot): boolean {
  return client.nameOrCompany.trim().length > 0;
}
