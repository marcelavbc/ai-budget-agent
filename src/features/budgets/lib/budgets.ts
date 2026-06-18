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
import type { BudgetStatus } from "@/features/budgets/lib/budgetStatus";
import type {
  BudgetLineRow,
  BudgetListRow,
  BudgetRow,
} from "@/features/budgets/types/budgetsDb";
import {
  createContact,
  updateContactById,
} from "@/features/contacts/lib/contacts";

export interface CreateBudgetInput {
  client: BudgetClientDetails;
  contactId: string;
  subtotal: number;
  status?: BudgetStatus;
  taxRate?: number;
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

type BudgetListQueryRow = BudgetListRow & {
  invoices?: { id: string | null } | { id: string | null }[] | null;
};

export async function createBudget({
  client,
  contactId,
  status = "draft",
  subtotal,
  taxRate = 0,
}: CreateBudgetInput): Promise<CreateBudgetResult> {
  const supabase = getSupabaseClient();
  const { tax_amount } = calcTotalsFromSubtotal(subtotal, taxRate);
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
        tax_rate: taxRate,
        tax_amount,
        lang: client.lang,
        project_name: normalizeOptionalString(
          (client.projectName ?? "").trim()
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
      "id,title,job_address,job_address_street,job_address_postal_code,job_address_city,status,document_date,notes,subtotal,tax_rate,tax_amount,created_at,updated_at,quote_number,estimated_time,lang,project_name"
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
      "id,title,job_address,job_address_street,job_address_postal_code,job_address_city,status,document_date,quote_number,created_at,lang,invoices!budget_id(id)"
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

export async function deleteBudgetWithLines(budgetId: string): Promise<void> {
  await deleteBudgetLines(budgetId);
  await deleteBudgetById(budgetId);
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
  taxRate?: number;
  status?: BudgetStatus;
}): Promise<void> {
  const {
    budgetId,
    contactId,
    client,
    items,
    taxRate = 0,
    status = "draft",
  } = args;
  const normalizedContactId = (contactId ?? "").trim();

  const { subtotal, tax_amount } = calcBudgetHeaderAmounts(items, taxRate);
  const derivedTitle = deriveBudgetTitle(client);

  const ensuredContactId =
    normalizedContactId && normalizedContactId.toLowerCase() !== "null"
      ? normalizedContactId
      : (
          await createContact({
            name: client.nameOrCompany,
          })
        ).id;

  if (ensuredContactId === normalizedContactId) {
    await updateContactById(ensuredContactId, {
      name: client.nameOrCompany,
    });
  }

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
    tax_rate: taxRate,
    tax_amount,
    lang: client.lang,
    project_name: normalizeOptionalString((client.projectName ?? "").trim()),
  });

  await replaceBudgetLines(budgetId, items);
  await ensureContactJobAddress(ensuredContactId, client);
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
    await updateContactById(contactId, {
      name: client.nameOrCompany,
    });
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
  });
  await createBudgetLines({ budgetId: id, items });
  await ensureContactJobAddress(contactId, client);
  return { budgetId: id, contactId };
}
