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
  dueDate?: string
): Promise<{ invoiceId: string }> {
  if (!isInvoicePricingMode(pricingMode)) {
    throw new Error("Mode de facturació no vàlid.");
  }

  const res = await fetch("/api/invoices/from-budget", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ budgetId, pricingMode, issueDate, dueDate }),
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

export async function emitInvoice(invoiceId: string): Promise<void> {
  const res = await fetch(`/api/invoices/${invoiceId}/emit`, {
    method: "POST",
  });

  if (!res.ok) {
    const data = await readJson(res);
    throw new Error(errorMessage(data, "No s'ha pogut emetre la factura."));
  }
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
