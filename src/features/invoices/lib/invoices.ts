import "server-only";

import { getSupabaseClient } from "@/core/lib/supabaseClient";
import { getBudgetLinesByBudgetId } from "@/features/budgets/lib/budgets";
import { dateFilterRange, matchesDateFilter, type DateFilter } from "@/shared/lib/dateFilter";
import type { InvoicePricingMode } from "@/features/invoices/types/invoice";
import { isInvoicePricingMode } from "@/features/invoices/types/invoice";
import type { Tables, TablesInsert } from "@/core/types/supabase";

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

export async function getInvoiceDashboardStats(
  filter?: DateFilter
): Promise<InvoiceDashboardStats> {
  const supabase = getSupabaseClient();
  const range = dateFilterRange(filter ?? null);
  let q = supabase
    .from("invoices")
    .select("pricing_mode,total,created_at");
  if (range) {
    q = q.gte("created_at", range.gte).lte("created_at", range.lte);
  }

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  const stats: InvoiceDashboardStats = {
    countWithoutIva: 0,
    countWithIva: 0,
    totalWithoutIva: 0,
    totalWithIva: 0,
  };
  for (const row of data ?? []) {
    if (!matchesDateFilter(row.created_at ?? null, filter ?? null)) continue;
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
      "id,budget_id,client_id,subtotal,tax_rate,tax_amount,total,pricing_mode,invoice_number,status,issue_date,due_date,notes,job_address,created_at"
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

  const supabase = getSupabaseClient();

  const { data: invoiceId, error: rpcError } = await supabase.rpc(
    "create_invoice_from_budget",
    {
      p_budget_id: budgetIdNormalized,
      p_pricing_mode: pricingMode,
    }
  );

  if (rpcError) throw new Error(rpcError.message);
  if (!invoiceId) throw new Error("No s'ha pogut generar la factura.");

  const invoiceIdStr = (invoiceId as unknown as string);

  const lines = await getBudgetLinesByBudgetId(budgetIdNormalized);

  if (lines.length > 0) {
    const invoiceLines: TablesInsert<"invoice_lines">[] = lines.map(
      (l, idx) => ({
        invoice_id: invoiceIdStr,
        description: ((l.title ?? "").trim() || "Partida") as string,
        quantity: l.quantity ?? 1,
        unit_price: l.unit_price ?? 0,
        subtotal:
          l.line_total ?? round2((l.quantity ?? 1) * (l.unit_price ?? 0)),
        sort_order: l.sort_order ?? idx,
      })
    );

    const { error: linesError } = await supabase
      .from("invoice_lines")
      .insert(invoiceLines);

    if (linesError) throw new Error(linesError.message);
  }

  return { invoiceId: invoiceIdStr };
}
