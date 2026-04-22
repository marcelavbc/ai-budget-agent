import type { BudgetClientDetails, BudgetClientItem } from "@/types/budget";
import { isValidEmail } from "@/lib/isValidEmail";

export interface BudgetDraftSnapshot {
  client: BudgetClientDetails;
  items: BudgetClientItem[];
}

export function isBudgetDraftComplete({
  client,
  items,
}: BudgetDraftSnapshot): boolean {
  if (client.nameOrCompany.trim().length === 0) return false;
  if (client.email.trim().length === 0) return false;
  if (!isValidEmail(client.email)) return false;
  if (client.address.trim().length === 0) return false;
  if (client.quoteNumber.trim().length === 0) return false;
  if (client.date.trim().length === 0) return false;
  if (client.estimatedTime.trim().length === 0) return false;

  if (items.length === 0) return false;
  for (const item of items) {
    if (item.description.trim().length === 0) return false;
  }

  return true;
}

