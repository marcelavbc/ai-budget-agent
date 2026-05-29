import type { BudgetClientDetails, BudgetClientItem } from "@/features/budgets/types/budget";
import type { BudgetStatus } from "@/features/budgets/lib/budgetStatus";

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

export async function saveBudgetWithLines(args: {
  client: BudgetClientDetails;
  items: BudgetClientItem[];
  contactId?: string | null;
}): Promise<{ budgetId: string; clientId: string }> {
  const res = await fetch("/api/budgets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  const data = await readJson(res);
  if (!res.ok) throw new Error(errorMessage(data, "No s'ha pogut guardar el pressupost."));
  const budgetId =
    typeof data === "object" && data !== null
      ? (data as { budgetId?: unknown }).budgetId
      : null;
  const clientId =
    typeof data === "object" && data !== null
      ? (data as { clientId?: unknown }).clientId
      : null;
  if (typeof budgetId !== "string" || !budgetId.trim()) {
    throw new Error("No s'ha pogut guardar el pressupost.");
  }
  if (typeof clientId !== "string" || !clientId.trim()) {
    throw new Error("No s'ha pogut guardar el pressupost.");
  }
  return { budgetId, clientId };
}

export async function updateBudgetWithLines(args: {
  budgetId: string;
  clientId: string | null;
  client: BudgetClientDetails;
  items: BudgetClientItem[];
  taxRate?: number;
  status?: BudgetStatus;
}): Promise<void> {
  const { budgetId, ...body } = args;
  const res = await fetch(`/api/budgets/${budgetId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await readJson(res);
  if (!res.ok) throw new Error(errorMessage(data, "No s'ha pogut actualitzar el pressupost."));
}

export async function updateBudgetById(
  budgetId: string,
  patch: Record<string, unknown>
): Promise<void> {
  const res = await fetch(`/api/budgets/${budgetId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const data = await readJson(res);
  if (!res.ok) throw new Error(errorMessage(data, "No s'ha pogut actualitzar el pressupost."));
}

export async function deleteBudgetWithLines(budgetId: string): Promise<void> {
  const res = await fetch(`/api/budgets/${budgetId}`, { method: "DELETE" });
  const data = await readJson(res);
  if (!res.ok) throw new Error(errorMessage(data, "No s'ha pogut eliminar el pressupost."));
}

export async function getBudgetExportData(budgetId: string): Promise<unknown> {
  const res = await fetch(`/api/budgets/${budgetId}/export`, { method: "GET" });
  const data = await readJson(res);
  if (!res.ok) throw new Error(errorMessage(data, "No s'ha pogut exportar el pressupost."));
  return data;
}

