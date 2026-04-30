import "server-only";

import { getSupabaseClient } from "@/lib/supabaseClient";
import { normalizeBudgetStatus } from "@/lib/budgetStatus";
import { getBudgetById, getBudgetLinesByBudgetId } from "@/lib/budgets";
import { calcTotalsFromSubtotal } from "@/lib/budgets/helpers";
import type { InvoicePricingMode } from "@/types/invoice";
import { isInvoicePricingMode } from "@/types/invoice";
import type { BudgetLineRow } from "@/types/budgetsDb";
import type { Tables, TablesInsert } from "@/types/supabase";

export type InvoiceRow = Tables<"invoices">;
export type InvoiceLineRow = Tables<"invoice_lines">;

export type BudgetInvoiceIds = {
  withoutIva: string | null;
  withIva: string | null;
};

export type InvoiceDashboardStats = {
  countWithoutIva: number;
  countWithIva: number;
  totalWithoutIva: number;
  totalWithIva: number;
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function sumLineSubtotals(lines: BudgetLineRow[]): number {
  return round2(
    lines.reduce(
      (s, l) =>
        s + (l.line_total ?? (l.quantity ?? 1) * (l.unit_price ?? 0)),
      0
    )
  );
}

export async function getInvoiceByBudgetIdAndPricing(
  budgetId: string,
  pricingMode: InvoicePricingMode
): Promise<Pick<InvoiceRow, "id"> | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("id")
    .eq("budget_id", budgetId)
    .eq("pricing_mode", pricingMode)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function getInvoicesForBudget(
  budgetId: string
): Promise<BudgetInvoiceIds> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("id,pricing_mode")
    .eq("budget_id", budgetId);
  if (error) throw new Error(error.message);

  const out: BudgetInvoiceIds = { withoutIva: null, withIva: null };
  for (const row of data ?? []) {
    if (row.pricing_mode === "with_iva") out.withIva = row.id;
    else if (row.pricing_mode === "without_iva") out.withoutIva = row.id;
  }
  return out;
}

/** One query for list UIs: budget_id → invoice ids per pricing mode. */
export async function getInvoiceIdsByBudgetIds(
  budgetIds: string[]
): Promise<Record<string, BudgetInvoiceIds>> {
  const uniq = [...new Set(budgetIds.map((id) => id.trim()).filter(Boolean))];
  const map = Object.fromEntries(
    uniq.map((id) => [id, { withoutIva: null, withIva: null }])
  ) as Record<string, BudgetInvoiceIds>;
  if (uniq.length === 0) return map;

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("id,budget_id,pricing_mode")
    .in("budget_id", uniq);
  if (error) throw new Error(error.message);

  for (const row of data ?? []) {
    const bid = row.budget_id;
    if (!bid || !map[bid]) continue;
    if (row.pricing_mode === "with_iva") map[bid].withIva = row.id;
    else if (row.pricing_mode === "without_iva") map[bid].withoutIva = row.id;
  }
  return map;
}

export async function getInvoiceDashboardStats(): Promise<InvoiceDashboardStats> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("pricing_mode,total");
  if (error) throw new Error(error.message);

  const stats: InvoiceDashboardStats = {
    countWithoutIva: 0,
    countWithIva: 0,
    totalWithoutIva: 0,
    totalWithIva: 0,
  };
  for (const row of data ?? []) {
    const t = typeof row.total === "number" ? row.total : 0;
    if (row.pricing_mode === "with_iva") {
      stats.countWithIva += 1;
      stats.totalWithIva += t;
    } else {
      stats.countWithoutIva += 1;
      stats.totalWithoutIva += t;
    }
  }
  stats.totalWithoutIva = round2(stats.totalWithoutIva);
  stats.totalWithIva = round2(stats.totalWithIva);
  return stats;
}

export async function getInvoiceById(id: string): Promise<InvoiceRow | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id,budget_id,client_id,subtotal,tax_rate,tax_amount,total,pricing_mode,created_at"
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function getInvoiceLinesByInvoiceId(
  invoiceId: string
): Promise<InvoiceLineRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("invoice_lines")
    .select(
      "id,invoice_id,description,quantity,unit_price,subtotal,sort_order,created_at"
    )
    .eq("invoice_id", invoiceId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createInvoiceFromBudget(
  budgetId: string,
  pricingMode: InvoicePricingMode
): Promise<{ invoiceId: string }> {
  if (!isInvoicePricingMode(pricingMode)) {
    throw new Error("Mode de facturació no vàlid.");
  }

  const budgetIdNormalized = budgetId.trim();
  if (!budgetIdNormalized) throw new Error("Invalid budgetId.");

  const existing = await getInvoiceByBudgetIdAndPricing(
    budgetIdNormalized,
    pricingMode
  );
  if (existing?.id) return { invoiceId: String(existing.id) };

  const [budget, lines] = await Promise.all([
    getBudgetById(budgetIdNormalized),
    getBudgetLinesByBudgetId(budgetIdNormalized),
  ]);

  if (!budget) throw new Error("No s'ha trobat el pressupost.");
  if (normalizeBudgetStatus(budget.status) !== "approved") {
    throw new Error("El pressupost no està aprovat.");
  }

  const lineSum = sumLineSubtotals(lines);
  const budgetSubtotal =
    typeof budget.subtotal === "number" ? budget.subtotal : lineSum;
  const subtotalBase = round2(budgetSubtotal || lineSum);

  let header: Omit<
    TablesInsert<"invoices">,
    "id" | "created_at"
  >;

  if (pricingMode === "without_iva") {
    header = {
      budget_id: budget.id,
      client_id: budget.client_id,
      subtotal: subtotalBase,
      tax_rate: 0,
      tax_amount: 0,
      total: subtotalBase,
      pricing_mode: "without_iva",
    };
  } else {
    const taxRate = typeof budget.tax_rate === "number" ? budget.tax_rate : 0;
    const derived = calcTotalsFromSubtotal(subtotalBase, taxRate);
    const taxAmount =
      typeof budget.tax_amount === "number"
        ? round2(budget.tax_amount)
        : derived.tax_amount;
    const total =
      typeof budget.total === "number"
        ? round2(budget.total)
        : round2(subtotalBase + taxAmount);

    header = {
      budget_id: budget.id,
      client_id: budget.client_id,
      subtotal: subtotalBase,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
      pricing_mode: "with_iva",
    };
  }

  const supabase = getSupabaseClient();

  const { data: created, error: createError } = await supabase
    .from("invoices")
    .insert([header])
    .select("id")
    .single();

  if (createError) throw new Error(createError.message);
  if (!created?.id) throw new Error("Supabase did not return an invoice id.");

  const invoiceId = String(created.id);

  const invoiceLines: TablesInsert<"invoice_lines">[] = lines.map((l, idx) => {
    const quantity = l.quantity ?? 1;
    const unitPrice = l.unit_price ?? 0;
    const lineSubtotal =
      l.line_total ?? round2((l.quantity ?? 1) * (l.unit_price ?? 0));

    return {
      invoice_id: invoiceId,
      description: ((l.title ?? "").trim() || "Partida") as string,
      quantity,
      unit_price: unitPrice,
      subtotal: lineSubtotal,
      sort_order: l.sort_order ?? idx,
    };
  });

  if (invoiceLines.length) {
    const { error: linesError } = await supabase
      .from("invoice_lines")
      .insert(invoiceLines);
    if (linesError) throw new Error(linesError.message);
  }

  return { invoiceId };
}
