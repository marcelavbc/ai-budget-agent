import type { InvoicePricingMode } from "@/features/invoices/types/invoice";
import { isInvoicePricingMode } from "@/features/invoices/types/invoice";

async function readJson(res: Response): Promise<unknown> {
  try {
    return (await res.json()) as unknown;
  } catch {
    return null;
  }
}

function errorMessage(data: unknown, fallback: string): string {
  if (typeof data === "object" && data !== null) {
    const msg = (data as { error?: unknown }).error;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return fallback;
}

export async function createInvoiceFromBudget(
  budgetId: string,
  pricingMode: InvoicePricingMode,
  issueDate?: string,
  dueDate?: string,
  taxRate?: number
): Promise<{ invoiceId: string }> {
  if (!isInvoicePricingMode(pricingMode)) {
    throw new Error("Mode de facturació no vàlid.");
  }

  const res = await fetch("/api/invoices/from-budget", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ budgetId, pricingMode, issueDate, dueDate, taxRate }),
  });

  const data = await readJson(res);
  if (!res.ok) {
    throw new Error(errorMessage(data, "No s'ha pogut generar la factura."));
  }

  const invoiceId =
    typeof data === "object" && data !== null
      ? (data as { invoiceId?: unknown }).invoiceId
      : null;
  if (typeof invoiceId !== "string" || !invoiceId.trim()) {
    throw new Error("No s'ha pogut generar la factura.");
  }

  return { invoiceId };
}

export async function getClientByBudgetId(budgetId: string): Promise<{
  tax_id: string | null;
  fiscal_address_street: string | null;
  fiscal_address_postal_code: string | null;
  fiscal_address_city: string | null;
} | null> {
  const res = await fetch(`/api/budgets/${budgetId}/client-data`);
  if (!res.ok) return null;
  return res.json() as Promise<{
    tax_id: string | null;
    fiscal_address_street: string | null;
    fiscal_address_postal_code: string | null;
    fiscal_address_city: string | null;
  } | null>;
}

export async function updateClientTaxId(
  budgetId: string,
  taxId: string
): Promise<void> {
  const res = await fetch(`/api/budgets/${budgetId}/client-tax-id`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taxId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(
      typeof data?.error === "string"
        ? data.error
        : "No s'ha pogut guardar el NIF."
    );
  }
}

export async function updateClientAddress(
  budgetId: string,
  data: {
    address_street?: string;
    address_postal_code?: string;
    address_city?: string;
  }
): Promise<void> {
  const res = await fetch(`/api/budgets/${budgetId}/client-address`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok)
    throw new Error("No s'ha pogut actualitzar l'adreça del client.");
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status: string
): Promise<void> {
  const res = await fetch(`/api/invoices/${invoiceId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(
      typeof data?.error === "string"
        ? data.error
        : "No s'ha pogut actualitzar l'estat de la factura."
    );
  }
}
