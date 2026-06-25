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
 * Una vegada un pressupost passa a "approved" o "invoiced", les dades
 * d'identitat del client queden congelades en el propi pressupost
 * (client_name, client_tax_id, client_address_*). Si existeixen,
 * SEMPRE prevalen sobre el contacte en viu, encara que el contacte
 * s'hagi editat després.
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
  const isFrozenStage = status === "approved" || status === "invoiced";
  const hasSnapshot = Boolean((budget.client_name ?? "").trim());

  if (isFrozenStage && hasSnapshot) {
    return {
      name: budget.client_name ?? "",
      tax_id: budget.client_tax_id,
      fiscal_address_street: budget.client_address_street,
      fiscal_address_postal_code: budget.client_address_postal_code,
      fiscal_address_city: budget.client_address_city,
      locked: true,
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
