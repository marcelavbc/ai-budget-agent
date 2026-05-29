import "server-only";

import { getSupabaseClient } from "@/core/lib/supabaseClient";
import { getBudgetLinesByBudgetId } from "@/features/budgets/lib/budgets";
import {
  dateFilterRange,
  matchesDateFilter,
  type DateFilter,
} from "@/shared/lib/dateFilter";
import type { InvoicePricingMode } from "@/features/invoices/types/invoice";
import { isInvoicePricingMode } from "@/features/invoices/types/invoice";
import type { Tables, TablesInsert } from "@/core/types/supabase";

export type InvoiceRow = Tables<"invoices">;
export type InvoiceLineRow = Tables<"invoice_lines">;

export type InvoiceListRow = {
  id: string;
  invoice_number: string | null;
  status: string;
  issue_date: string | null;
  total: number;
  pricing_mode: string;
  client_name: string | null;
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

export async function getInvoiceDashboardStats(
  filter?: DateFilter
): Promise<InvoiceDashboardStats> {
  const supabase = getSupabaseClient();
  const range = dateFilterRange(filter ?? null);
  let q = supabase.from("invoices").select("pricing_mode,total,created_at");
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
      "id,budget_id,client_id,subtotal,tax_rate,tax_amount,total,pricing_mode,invoice_number,status,issue_date,due_date,notes,job_address,created_at,lang"
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as InvoiceRow | null;
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
  return (data ?? []) as InvoiceLineRow[];
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

  const budgetIdNormalized = budgetId.trim();
  if (!budgetIdNormalized) throw new Error("Invalid budgetId.");

  const supabase = getSupabaseClient();

  const { data: invoiceId, error: rpcError } = await supabase.rpc(
    "create_invoice_from_budget",
    {
      p_budget_id: budgetIdNormalized,
      p_pricing_mode: pricingMode,
      ...(issueDate ? { p_issue_date: issueDate } : {}),
      ...(dueDate ? { p_due_date: dueDate } : {}),
      ...(taxRate != null ? { p_tax_rate: taxRate } : {}),
    }
  );

  if (rpcError) throw new Error(rpcError.message);
  if (!invoiceId) throw new Error("No s'ha pogut generar la factura.");

  const invoiceIdStr = invoiceId as unknown as string;

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

export async function getInvoiceList(): Promise<InvoiceListRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("invoices")
    .select(
      "id, invoice_number, status, issue_date, total, pricing_mode, clients(name)"
    )
    .order("issue_date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    invoice_number: row.invoice_number,
    status: row.status,
    issue_date: row.issue_date,
    total: row.total,
    pricing_mode: row.pricing_mode,
    client_name:
      (row.clients as unknown as { name: string | null } | null)?.name ?? null,
  }));
}

export type SettingsRow = Tables<"settings">;

export async function getSettings(): Promise<SettingsRow | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("settings")
    .select(
      "id,owner_name,owner_address,owner_postal_code,owner_city,owner_nif,bank_iban,bank_name,default_tax_rate"
    )
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}
