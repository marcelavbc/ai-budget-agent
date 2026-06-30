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

/**
 * Once a budget reaches "invoiced", client identity data is frozen on the
 * budget itself (client_name, client_tax_id, client_address_*). When present,
 * those fields always take precedence over the live contact, even if the
 * contact was edited later.
 */
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
  const isFrozenStage = status === "invoiced";
  const hasSnapshot = Boolean((budget.client_name ?? "").trim());

  if (hasSnapshot) {
    return {
      name: budget.client_name ?? "",
      tax_id: budget.client_tax_id,
      fiscal_address_street: budget.client_address_street,
      fiscal_address_postal_code: budget.client_address_postal_code,
      fiscal_address_city: budget.client_address_city,
      locked: isFrozenStage,
    };
  }

  return {
    name: contact.name ?? "",
    tax_id: contact.tax_id,
    fiscal_address_street: contact.fiscal_address_street,
    fiscal_address_postal_code: contact.fiscal_address_postal_code,
    fiscal_address_city: contact.fiscal_address_city,
    locked: false,
  };
}
