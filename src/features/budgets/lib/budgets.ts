import "server-only";

import { getSupabaseClient } from "@/core/lib/supabaseClient";
import {
  dateFilterRange,
  matchesDateFilter,
  type DateFilter,
} from "@/shared/lib/dateFilter";
import type {
  BudgetClientDetails,
  BudgetClientItem,
} from "@/features/budgets/types/budget";
import type { TablesInsert } from "@/core/types/supabase";
import {
  calcBudgetHeaderAmounts,
  calcTotalsFromSubtotal,
  deriveBudgetTitle,
  normalizeOptionalString,
  toBudgetLineRows,
} from "@/features/budgets/lib/helpers";
import {
  normalizeBudgetStatus,
  type BudgetStatus,
} from "@/features/budgets/lib/budgetStatus";
import type {
  BudgetLineRow,
  BudgetListRow,
  BudgetRow,
} from "@/features/budgets/types/budgetsDb";
import {
  contactHasExtraData,
  contactHasReferences,
  createContact,
  deleteContactById,
  getContactAddressCount,
  getContactById,
  updateContactById,
  getContactReferenceCounts,
  type ContactRow,
} from "@/features/contacts/lib/contacts";

export interface CreateBudgetInput {
  client: BudgetClientDetails;
  contactId: string;
  subtotal: number;
  status?: BudgetStatus;
  taxRate?: number | null;
}

export interface CreateBudgetResult {
  id: string;
}

function formatJobAddress(client: BudgetClientDetails): string | null {
  return normalizeOptionalString(
    [
      client.jobAddressStreet,
      client.jobAddressPostalCode,
      client.jobAddressCity,
    ]
      .map((value) => (value ?? "").trim())
      .filter(Boolean)
      .join(", ")
  );
}

function jobAddressFields(client: BudgetClientDetails) {
  return {
    job_address_street: normalizeOptionalString(
      (client.jobAddressStreet ?? "").trim()
    ),
    job_address_postal_code: normalizeOptionalString(
      (client.jobAddressPostalCode ?? "").trim()
    ),
    job_address_city: normalizeOptionalString(
      (client.jobAddressCity ?? "").trim()
    ),
  };
}

function normalizedAddressPart(
  value: string | null | undefined
): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed ? trimmed : null;
}

async function ensureContactJobAddress(
  contactId: string,
  client: BudgetClientDetails
): Promise<void> {
  const street = normalizedAddressPart(client.jobAddressStreet);
  const postal_code = normalizedAddressPart(client.jobAddressPostalCode);
  const city = normalizedAddressPart(client.jobAddressCity);

  if (!street && !postal_code && !city) {
    return;
  }

  const supabase = getSupabaseClient();
  const { data: existing, error: fetchError } = await supabase
    .from("contact_addresses")
    .select("street, postal_code, city")
    .eq("contact_id", contactId);

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  const alreadyExists = (existing ?? []).some(
    (row) =>
      normalizedAddressPart(row.street) === street &&
      normalizedAddressPart(row.postal_code) === postal_code &&
      normalizedAddressPart(row.city) === city
  );

  if (alreadyExists) {
    return;
  }

  const { error: insertError } = await supabase
    .from("contact_addresses")
    .insert([
      {
        contact_id: contactId,
        street,
        postal_code,
        city,
        label: null,
      },
    ]);

  if (insertError) {
    throw new Error(insertError.message);
  }
}

/**
 * Seed contact fiscal fields (tax_id and fiscal address) from a budget's
 * client details. Only writes each field if the contact doesn't already have
 * a value. This is a one-time seed and will never overwrite existing values.
 */
export async function ensureContactFiscalData(
  contactId: string,
  client: BudgetClientDetails
): Promise<void> {
  const normalizedId = (contactId ?? "").trim();
  if (!normalizedId || normalizedId.toLowerCase() === "null") return;

  const contact = await getContactById(normalizedId);

  const patch: Partial<
    Pick<
      ContactRow,
      | "tax_id"
      | "fiscal_address_street"
      | "fiscal_address_postal_code"
      | "fiscal_address_city"
    >
  > = {};

  const contactTax = (contact.tax_id ?? "").trim();
  const clientTax = (client.clientTaxId ?? "").trim();
  if (!contactTax && clientTax) patch.tax_id = clientTax;

  const contactStreet = (contact.fiscal_address_street ?? "").trim();
  const clientStreet = (client.clientAddressStreet ?? "").trim();
  if (!contactStreet && clientStreet)
    patch.fiscal_address_street = clientStreet;

  const contactPostal = (contact.fiscal_address_postal_code ?? "").trim();
  const clientPostal = (client.clientAddressPostalCode ?? "").trim();
  if (!contactPostal && clientPostal)
    patch.fiscal_address_postal_code = clientPostal;

  const contactCity = (contact.fiscal_address_city ?? "").trim();
  const clientCity = (client.clientAddressCity ?? "").trim();
  if (!contactCity && clientCity) patch.fiscal_address_city = clientCity;

  // If there's nothing to update, return early.
  if (Object.keys(patch).length === 0) return;

  await updateContactById(normalizedId, patch);
}

type BudgetListQueryRow = BudgetListRow & {
  invoices?: { id: string | null } | { id: string | null }[] | null;
};

export async function createBudget({
  client,
  contactId,
  status = "draft",
  subtotal,
  taxRate,
}: CreateBudgetInput): Promise<CreateBudgetResult> {
  const supabase = getSupabaseClient();
  const candidateTaxRate = client.taxRate ?? taxRate ?? null;
  const selectedTaxRate =
    typeof candidateTaxRate === "number" && Number.isFinite(candidateTaxRate)
      ? candidateTaxRate
      : null;
  const { tax_amount } = calcTotalsFromSubtotal(subtotal, selectedTaxRate);
  const derivedTitle = deriveBudgetTitle(client);

  const { data, error } = await supabase
    .from("budgets")
    .insert([
      {
        contact_id: contactId,
        title: derivedTitle ?? "",
        ...jobAddressFields(client),
        job_address: formatJobAddress(client),
        quote_number: normalizeOptionalString(client.quoteNumber),
        document_date: normalizeOptionalString(client.date),
        estimated_time: normalizeOptionalString(client.estimatedTime),
        status,
        notes: null,
        subtotal,
        tax_rate: selectedTaxRate,
        tax_amount,
        lang: client.lang,
        project_name: normalizeOptionalString(
          (client.projectName ?? "").trim()
        ),
        client_name: normalizeOptionalString(
          (client.nameOrCompany ?? "").trim()
        ),
        client_tax_id: normalizeOptionalString(
          (client.clientTaxId ?? "").trim()
        ),
        client_address_street: normalizeOptionalString(
          (client.clientAddressStreet ?? "").trim()
        ),
        client_address_postal_code: normalizeOptionalString(
          (client.clientAddressPostalCode ?? "").trim()
        ),
        client_address_city: normalizeOptionalString(
          (client.clientAddressCity ?? "").trim()
        ),
      },
    ])
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }
  if (!data?.id) {
    throw new Error("Supabase did not return a budget id.");
  }

  return { id: String(data.id) };
}

export async function getBudgetById(id: string): Promise<BudgetRow | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("budgets")
    .select(
      "id,contact_id,title,job_address,job_address_street,job_address_postal_code,job_address_city,status,document_date,notes,subtotal,tax_rate,tax_amount,created_at,updated_at,quote_number,estimated_time,lang,project_name,client_name,client_tax_id,client_address_street,client_address_postal_code,client_address_city"
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as BudgetRow;
}

export async function updateBudgetById(
  id: string,
  patch: Partial<
    Pick<
      BudgetRow,
      | "contact_id"
      | "title"
      | "job_address"
      | "job_address_street"
      | "job_address_postal_code"
      | "job_address_city"
      | "quote_number"
      | "document_date"
      | "estimated_time"
      | "status"
      | "subtotal"
      | "tax_rate"
      | "tax_amount"
      | "lang"
      | "project_name"
      | "client_name"
      | "client_tax_id"
      | "client_address_street"
      | "client_address_postal_code"
      | "client_address_city"
    >
  >
): Promise<void> {
  const supabase = getSupabaseClient();

  const normalized = {
    contact_id: patch.contact_id,
    title: typeof patch.title === "string" ? patch.title.trim() : patch.title,
    job_address:
      typeof patch.job_address === "string"
        ? patch.job_address.trim()
        : patch.job_address,
    job_address_street:
      typeof patch.job_address_street === "string"
        ? patch.job_address_street.trim()
        : patch.job_address_street,
    job_address_postal_code:
      typeof patch.job_address_postal_code === "string"
        ? patch.job_address_postal_code.trim()
        : patch.job_address_postal_code,
    job_address_city:
      typeof patch.job_address_city === "string"
        ? patch.job_address_city.trim()
        : patch.job_address_city,
    quote_number:
      typeof patch.quote_number === "string"
        ? patch.quote_number.trim()
        : patch.quote_number,
    document_date:
      typeof patch.document_date === "string"
        ? patch.document_date.trim()
        : patch.document_date,
    estimated_time:
      typeof patch.estimated_time === "string"
        ? patch.estimated_time.trim()
        : patch.estimated_time,
    status:
      typeof patch.status === "string" ? patch.status.trim() : patch.status,
    subtotal: patch.subtotal,
    tax_rate: patch.tax_rate,
    tax_amount: patch.tax_amount,
    lang: patch.lang,
    project_name:
      typeof patch.project_name === "string"
        ? patch.project_name.trim()
        : patch.project_name,
    ...(patch.client_name !== undefined
      ? {
          client_name: normalizeOptionalString(
            (patch.client_name ?? "").trim()
          ),
        }
      : {}),
    ...(patch.client_tax_id !== undefined
      ? {
          client_tax_id: normalizeOptionalString(
            (patch.client_tax_id ?? "").trim()
          ),
        }
      : {}),
    ...(patch.client_address_street !== undefined
      ? {
          client_address_street: normalizeOptionalString(
            (patch.client_address_street ?? "").trim()
          ),
        }
      : {}),
    ...(patch.client_address_postal_code !== undefined
      ? {
          client_address_postal_code: normalizeOptionalString(
            (patch.client_address_postal_code ?? "").trim()
          ),
        }
      : {}),
    ...(patch.client_address_city !== undefined
      ? {
          client_address_city: normalizeOptionalString(
            (patch.client_address_city ?? "").trim()
          ),
        }
      : {}),
  };

  const { error } = await supabase
    .from("budgets")
    .update(normalized)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getBudgets(
  filter?: DateFilter
): Promise<BudgetListRow[]> {
  const supabase = getSupabaseClient();
  const range = dateFilterRange(filter ?? null);
  let q = supabase
    .from("budgets")
    .select(
      "id,title,job_address,job_address_street,job_address_postal_code,job_address_city,client_tax_id,client_address_street,client_address_postal_code,client_address_city,tax_rate,status,document_date,quote_number,created_at,lang,invoices!budget_id(id)"
    )
    .order("document_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (range) {
    q = q.gte("created_at", range.gte).lte("created_at", range.lte);
  }

  const { data, error } = await q;

  if (error) throw new Error(error.message);
  const rows = ((data ?? []) as unknown as BudgetListQueryRow[]).map((row) => {
    const { invoices, ...budget } = row;
    const invoice = Array.isArray(invoices) ? invoices[0] : invoices;
    return {
      ...budget,
      invoice_id: invoice?.id ?? null,
    };
  });
  if (!filter?.months?.length) return rows;
  return rows.filter((r) => matchesDateFilter(r.created_at ?? null, filter));
}

export async function deleteBudgetLines(budgetId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("budget_lines")
    .delete()
    .eq("budget_id", budgetId);
  if (error) throw new Error(error.message);
}

export async function deleteBudgetById(budgetId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("budgets").delete().eq("id", budgetId);
  if (error) throw new Error(error.message);
}

export type DeleteBudgetResult =
  | { contactStatus: "kept" }
  | { contactStatus: "deleted_orphan"; contactId: string }
  | { contactStatus: "pending_confirmation"; contactId: string };

export async function deleteBudgetWithLines(
  budgetId: string
): Promise<DeleteBudgetResult> {
  const budget = await getBudgetById(budgetId);
  if (!budget) {
    throw new Error("No s'ha trobat el pressupost.");
  }

  if (normalizeBudgetStatus(budget.status) === "invoiced") {
    throw new Error("No es pot eliminar un pressupost facturat.");
  }

  const contactId = budget.contact_id;

  await deleteBudgetLines(budgetId);
  await deleteBudgetById(budgetId);

  if (!contactId) {
    return { contactStatus: "kept" };
  }

  const counts = await getContactReferenceCounts(contactId);
  if (contactHasReferences(counts)) {
    return { contactStatus: "kept" };
  }

  const contact = await getContactById(contactId);
  const addressCount = await getContactAddressCount(contactId);
  if (!contactHasExtraData({ ...contact, addressCount })) {
    await deleteContactById(contactId);
    return { contactStatus: "deleted_orphan", contactId };
  }

  return { contactStatus: "pending_confirmation", contactId };
}

export async function replaceBudgetLines(
  budgetId: string,
  items: BudgetClientItem[]
): Promise<void> {
  const supabase = getSupabaseClient();
  const rows: TablesInsert<"budget_lines">[] = toBudgetLineRows(
    budgetId,
    items
  );

  await deleteBudgetLines(budgetId);
  const { error } = await supabase.from("budget_lines").insert(rows);
  if (error) throw new Error(error.message);
}

export async function updateBudgetWithLines(args: {
  budgetId: string;
  contactId: string | null;
  client: BudgetClientDetails;
  items: BudgetClientItem[];
  taxRate?: number | null;
  status?: BudgetStatus;
}): Promise<void> {
  const { budgetId, contactId, client, items, taxRate, status = "draft" } =
    args;
  const normalizedContactId = (contactId ?? "").trim();

  const candidateTaxRate = client.taxRate ?? taxRate ?? null;
  const selectedTaxRate =
    typeof candidateTaxRate === "number" && Number.isFinite(candidateTaxRate)
      ? candidateTaxRate
      : null;
  const { subtotal, tax_amount } = calcBudgetHeaderAmounts(
    items,
    selectedTaxRate
  );
  const derivedTitle = deriveBudgetTitle(client);

  const ensuredContactId =
    normalizedContactId && normalizedContactId.toLowerCase() !== "null"
      ? normalizedContactId
      : (
          await createContact({
            name: client.nameOrCompany,
          })
        ).id;

  await updateBudgetById(budgetId, {
    contact_id: ensuredContactId,
    title: derivedTitle ?? "",
    ...jobAddressFields(client),
    job_address: formatJobAddress(client),
    quote_number: normalizeOptionalString(client.quoteNumber),
    document_date: normalizeOptionalString(client.date),
    estimated_time: normalizeOptionalString(client.estimatedTime),
    status,
    subtotal,
    tax_rate: selectedTaxRate,
    tax_amount,
    lang: client.lang,
    project_name: normalizeOptionalString((client.projectName ?? "").trim()),
    client_name: client.nameOrCompany,
    client_tax_id: client.clientTaxId,
    client_address_street: client.clientAddressStreet,
    client_address_postal_code: client.clientAddressPostalCode,
    client_address_city: client.clientAddressCity,
  });

  await replaceBudgetLines(budgetId, items);
  await ensureContactJobAddress(ensuredContactId, client);
  await ensureContactFiscalData(ensuredContactId, client);
}

export interface CreateBudgetLinesInput {
  budgetId: string;
  items: BudgetClientItem[];
}

export async function createBudgetLines({
  budgetId,
  items,
}: CreateBudgetLinesInput): Promise<void> {
  const supabase = getSupabaseClient();
  const rows: TablesInsert<"budget_lines">[] = toBudgetLineRows(
    budgetId,
    items
  );

  const { error } = await supabase.from("budget_lines").insert(rows);
  if (error) {
    throw new Error(error.message);
  }
}

export async function getBudgetLinesByBudgetId(
  budgetId: string
): Promise<BudgetLineRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("budget_lines")
    .select(
      "id,budget_id,title,description,quantity,unit,unit_price,line_total,option_group_id,option_label,sort_order,created_at"
    )
    .eq("budget_id", budgetId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export interface SaveBudgetWithLinesInput {
  client: BudgetClientDetails;
  items: BudgetClientItem[];
  contactId?: string | null;
}

export async function saveBudgetWithLines({
  client,
  items,
  contactId: providedContactId,
}: SaveBudgetWithLinesInput): Promise<{ budgetId: string; contactId: string }> {
  const normalizedProvided = (providedContactId ?? "").trim();
  let contactId: string;

  if (normalizedProvided && normalizedProvided.toLowerCase() !== "null") {
    contactId = normalizedProvided;
  } else {
    const created = await createContact({
      name: client.nameOrCompany,
    });
    contactId = created.id;
  }

  const { subtotal } = calcBudgetHeaderAmounts(items, 0);
  const { id } = await createBudget({
    client,
    contactId,
    subtotal,
    status: "draft",
    taxRate: client.taxRate,
  });
  await createBudgetLines({ budgetId: id, items });
  await ensureContactJobAddress(contactId, client);
  await ensureContactFiscalData(contactId, client);
  return { budgetId: id, contactId };
}
