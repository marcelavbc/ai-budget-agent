import "server-only";

import { getSupabaseClient } from "@/core/lib/supabaseClient";
import type { Tables, TablesUpdate } from "@/core/types/supabase";

export type ContactRow = Tables<"contacts">;

export interface CreateContactInput {
  name: string;
  phone?: string | null;
}

export async function getContactById(id: string | null): Promise<ContactRow> {
  const supabase = getSupabaseClient();
  const normalizedId = (id ?? "").trim();
  if (!normalizedId || normalizedId.toLowerCase() === "null") {
    return {
      id: normalizedId || "unknown",
      name: "",
      phone: null,
      email: null,
      tax_id: null,
      fiscal_address_street: null,
      fiscal_address_postal_code: null,
      fiscal_address_city: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as ContactRow;
  }

  const { data, error } = await supabase
    .from("contacts")
    .select(
      "id,name,phone,email,tax_id,fiscal_address_street,fiscal_address_postal_code,fiscal_address_city,created_at,updated_at"
    )
    .eq("id", normalizedId)
    .maybeSingle();
  if (error) {
    const code = (error as unknown as { code?: string }).code;
    if (code === "PGRST116" || code === "22P02") {
      return {
        id: normalizedId,
        name: "",
        phone: null,
        email: null,
        tax_id: null,
        fiscal_address_street: null,
        fiscal_address_postal_code: null,
        fiscal_address_city: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as ContactRow;
    }
    throw new Error(error.message);
  }
  if (!data) {
    return {
      id: normalizedId,
      name: "",
      phone: null,
      email: null,
      tax_id: null,
      fiscal_address_street: null,
      fiscal_address_postal_code: null,
      fiscal_address_city: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as ContactRow;
  }
  return data as ContactRow;
}

export async function createContact({
  name,
  phone = null,
}: CreateContactInput): Promise<{ id: string }> {
  const supabase = getSupabaseClient();
  const normalizedName = name.trim();
  const normalizedPhone = (phone ?? "").trim();

  const { data, error } = await supabase
    .from("contacts")
    .insert([
      {
        name: normalizedName,
        phone: normalizedPhone ? normalizedPhone : null,
      },
    ])
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  if (!data?.id) throw new Error("Supabase did not return a contact id.");
  return { id: String(data.id) };
}

export async function updateContactById(
  id: string,
  patch: Partial<
    Pick<
      ContactRow,
      | "name"
      | "phone"
      | "tax_id"
      | "fiscal_address_street"
      | "fiscal_address_postal_code"
      | "fiscal_address_city"
    >
  >
): Promise<void> {
  const supabase = getSupabaseClient();
  const normalized: Record<string, string | null> = {};
  for (const key of [
    "name",
    "phone",
    "tax_id",
    "fiscal_address_street",
    "fiscal_address_postal_code",
    "fiscal_address_city",
  ] as const) {
    if (key in patch) {
      const value = patch[key];
      normalized[key] =
        typeof value === "string" ? value.trim() : (value ?? null);
    }
  }

  const { error } = await supabase
    .from("contacts")
    .update(normalized as TablesUpdate<"contacts">)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getContactList(): Promise<ContactRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("contacts")
    .select(
      "id,name,phone,email,tax_id,fiscal_address_street,fiscal_address_postal_code,fiscal_address_city,created_at,updated_at"
    )
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as ContactRow[];
}

export interface ContactDetailBudgetRow {
  id: string;
  title: string | null;
  status: string;
  quote_number: string | null;
  document_date: string | null;
  subtotal: number | null;
}

export interface ContactDetailInvoiceRow {
  id: string;
  invoice_number: string | null;
  status: string;
  issue_date: string | null;
  total: number;
}

export interface ContactDetailTotals {
  budgetCountByStatus: Record<string, number>;
  totalIssued: number;
  totalPaid: number;
}

export interface ContactDetail {
  contact: ContactRow;
  budgets: ContactDetailBudgetRow[];
  invoices: ContactDetailInvoiceRow[];
  totals: ContactDetailTotals;
}

export function buildContactDetailTotals(
  budgets: Pick<ContactDetailBudgetRow, "status">[],
  invoices: Pick<ContactDetailInvoiceRow, "status" | "total">[]
): ContactDetailTotals {
  const budgetCountByStatus: Record<string, number> = {};
  for (const b of budgets) {
    budgetCountByStatus[b.status] = (budgetCountByStatus[b.status] ?? 0) + 1;
  }

  let totalIssued = 0;
  let totalPaid = 0;
  for (const inv of invoices) {
    const t = typeof inv.total === "number" ? inv.total : 0;
    totalIssued += t;
    if (inv.status === "paid") {
      totalPaid += t;
    }
  }

  return {
    budgetCountByStatus,
    totalIssued: Math.round(totalIssued * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
  };
}

export async function getContactDetail(
  id: string
): Promise<ContactDetail | null> {
  const supabase = getSupabaseClient();
  const normalizedId = id.trim();
  if (!normalizedId) return null;

  const { data: contactData, error: contactError } = await supabase
    .from("contacts")
    .select(
      "id,name,phone,email,tax_id,fiscal_address_street,fiscal_address_postal_code,fiscal_address_city,created_at,updated_at"
    )
    .eq("id", normalizedId)
    .maybeSingle();

  if (contactError) throw new Error(contactError.message);
  if (!contactData) return null;

  const [
    { data: budgetsData, error: budgetsError },
    { data: invoicesData, error: invoicesError },
  ] = await Promise.all([
    supabase
      .from("budgets")
      .select("id,title,status,quote_number,document_date,subtotal")
      .eq("contact_id", normalizedId)
      .order("document_date", { ascending: false, nullsFirst: false }),
    supabase
      .from("invoices")
      .select("id,invoice_number,status,issue_date,total")
      .eq("contact_id", normalizedId)
      .order("issue_date", { ascending: false, nullsFirst: false }),
  ]);

  if (budgetsError) throw new Error(budgetsError.message);
  if (invoicesError) throw new Error(invoicesError.message);

  const budgets = (budgetsData ?? []) as ContactDetailBudgetRow[];
  const invoices = (invoicesData ?? []) as ContactDetailInvoiceRow[];

  return {
    contact: contactData as ContactRow,
    budgets,
    invoices,
    totals: buildContactDetailTotals(budgets, invoices),
  };
}
export interface ContactReferenceCounts {
  budgetCount: number;
  invoiceCount: number;
}

/** Pure: testable without Supabase. */
export function contactHasReferences(counts: ContactReferenceCounts): boolean {
  return counts.budgetCount > 0 || counts.invoiceCount > 0;
}

export interface ContactExtraDataInput {
  phone: string | null;
  email: string | null;
  tax_id: string | null;
  addressCount: number;
}

/** Pure: true if the contact has any data beyond just a name. */
export function contactHasExtraData(input: ContactExtraDataInput): boolean {
  return Boolean(
    (input.phone ?? "").trim() ||
      (input.email ?? "").trim() ||
      (input.tax_id ?? "").trim() ||
      input.addressCount > 0
  );
}

export async function getContactAddressCount(contactId: string): Promise<number> {
  const supabase = getSupabaseClient();
  const { count, error } = await supabase
    .from("contact_addresses")
    .select("id", { count: "exact", head: true })
    .eq("contact_id", contactId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getContactReferenceCounts(
  contactId: string
): Promise<ContactReferenceCounts> {
  const supabase = getSupabaseClient();
  const [
    { count: budgetCount, error: budgetsError },
    { count: invoiceCount, error: invoicesError },
  ] = await Promise.all([
    supabase
      .from("budgets")
      .select("id", { count: "exact", head: true })
      .eq("contact_id", contactId),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("contact_id", contactId),
  ]);

  if (budgetsError) throw new Error(budgetsError.message);
  if (invoicesError) throw new Error(invoicesError.message);

  return {
    budgetCount: budgetCount ?? 0,
    invoiceCount: invoiceCount ?? 0,
  };
}

export async function deleteContactById(id: string): Promise<void> {
  const normalizedId = id.trim();
  if (!normalizedId) throw new Error("Identificador de contacte invàlid.");

  const counts = await getContactReferenceCounts(normalizedId);
  if (contactHasReferences(counts)) {
    throw new Error(
      "No es pot eliminar: el contacte té pressupostos o factures associades."
    );
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", normalizedId);
  if (error) throw new Error(error.message);
}
