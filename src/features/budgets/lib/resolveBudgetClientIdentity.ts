import type { BudgetRow } from "@/features/budgets/types/budgetsDb";
import type { ContactRow } from "@/features/contacts/lib/contacts";
import { normalizeBudgetStatus } from "@/features/budgets/lib/budgetStatus";

export interface ResolvedClientIdentity {
  name: string;
  tax_id: string | null;
  fiscal_address_street: string | null;
  fiscal_address_postal_code: string | null;
  fiscal_address_city: string | null;
  locked: boolean;
}

export function resolveBudgetClientIdentity(
  budget: Pick<
    BudgetRow,
    | "status"
    | "client_name"
    | "client_tax_id"
    | "client_address_street"
    | "client_address_postal_code"
    | "client_address_city"
  >,
  contact: ContactRow
): ResolvedClientIdentity {
  const status = normalizeBudgetStatus(budget.status);
  const budgetName = (budget.client_name ?? "").trim();
  const contactName = (contact.name ?? "").trim();

  return {
    name: budgetName || contactName,
    tax_id: budget.client_tax_id,
    fiscal_address_street: budget.client_address_street,
    fiscal_address_postal_code: budget.client_address_postal_code,
    fiscal_address_city: budget.client_address_city,
    locked: status === "invoiced",
  };
}
