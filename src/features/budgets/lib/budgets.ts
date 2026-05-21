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
  ClientRow,
} from "@/features/budgets/types/budgetsDb";

export interface CreateBudgetInput {
  client: BudgetClientDetails;
  clientId: string;
  subtotal: number;
  status?: BudgetStatus;
  taxRate?: number;
}

export interface CreateBudgetResult {
  id: string;
}

export interface CreateClientInput {
  name: string;
  phone?: string | null;
  address_street?: string | null;
  address_postal_code?: string | null;
  address_city?: string | null;
}

type BudgetListQueryRow = BudgetListRow & {
  invoices?: { id: string | null } | { id: string | null }[] | null;
};

export async function createClient({
  name,
  phone = null,
  address_street = null,
  address_postal_code = null,
  address_city = null,
}: CreateClientInput): Promise<{ id: string }> {
  const supabase = getSupabaseClient();
  const normalizedName = name.trim();
  const normalizedPhone = (phone ?? "").trim();

  const { data, error } = await supabase
    .from("clients")
    .insert([
      {
        name: normalizedName,
        phone: normalizeOptionalString(normalizedPhone),
        address_street: normalizeOptionalString((address_street ?? "").trim()),
        address_postal_code: normalizeOptionalString(
          (address_postal_code ?? "").trim()
        ),
        address_city: normalizeOptionalString((address_city ?? "").trim()),
      },
    ])
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  if (!data?.id) throw new Error("Supabase did not return a client id.");
  return { id: String(data.id) };
}

export async function updateClientById(
  id: string,
  patch: Partial<
    Pick<
      ClientRow,
      | "name"
      | "phone"
      | "address_street"
      | "address_postal_code"
      | "address_city"
    >
  >
): Promise<void> {
  const supabase = getSupabaseClient();
  const normalized = {
    name: typeof patch.name === "string" ? patch.name.trim() : patch.name,
    phone: typeof patch.phone === "string" ? patch.phone.trim() : patch.phone,
    address_street:
      typeof patch.address_street === "string"
        ? patch.address_street.trim()
        : patch.address_street,
    address_postal_code:
      typeof patch.address_postal_code === "string"
        ? patch.address_postal_code.trim()
        : patch.address_postal_code,
    address_city:
      typeof patch.address_city === "string"
        ? patch.address_city.trim()
        : patch.address_city,
  };

  const { error } = await supabase
    .from("clients")
    .update(normalized)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getClientById(id: string | null): Promise<ClientRow> {
  const supabase = getSupabaseClient();
  const normalizedId = (id ?? "").trim();
  if (!normalizedId || normalizedId.toLowerCase() === "null") {
    return {
      id: normalizedId || "unknown",
      name: "",
      phone: null,
      address_street: null,
      address_postal_code: null,
      address_city: null,
      tax_id: null,
      created_at: new Date().toISOString(),
    } as ClientRow;
  }

  const { data, error } = await supabase
    .from("clients")
    .select(
      "id,name,phone,address_street,address_postal_code,address_city,tax_id,created_at"
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
        address_street: null,
        address_postal_code: null,
        address_city: null,
        tax_id: null,
        created_at: new Date().toISOString(),
      } as ClientRow;
    }
    throw new Error(error.message);
  }
  if (!data) {
    return {
      id: normalizedId,
      name: "",
      phone: null,
      address_street: null,
      address_postal_code: null,
      address_city: null,
      tax_id: null,
      created_at: new Date().toISOString(),
    } as ClientRow;
  }
  return data as ClientRow;
}

export async function createBudget({
  client,
  clientId,
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
        client_id: clientId,
        title: derivedTitle ?? "",
        job_address: normalizeOptionalString(
          [client.addressStreet, client.addressPostalCode, client.addressCity]
            .map((value) => (value ?? "").trim())
            .filter(Boolean)
            .join(", ")
        ),
        quote_number: normalizeOptionalString(client.quoteNumber),
        document_date: normalizeOptionalString(client.date),
        estimated_time: normalizeOptionalString(client.estimatedTime),
        status,
        notes: null,
        subtotal,
        tax_rate: taxRate,
        tax_amount,
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
      "id,client_id,title,job_address,status,issue_date,document_date,notes,subtotal,tax_rate,tax_amount,created_at,updated_at,quote_number,estimated_time"
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
      | "client_id"
      | "title"
      | "job_address"
      | "quote_number"
      | "document_date"
      | "estimated_time"
      | "status"
      | "subtotal"
      | "tax_rate"
      | "tax_amount"
    >
  >
): Promise<void> {
  const supabase = getSupabaseClient();
  const normalized = {
    client_id: patch.client_id,
    title: typeof patch.title === "string" ? patch.title.trim() : patch.title,
    job_address:
      typeof patch.job_address === "string"
        ? patch.job_address.trim()
        : patch.job_address,
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
      "id,title,job_address,status,document_date,quote_number,created_at,invoices!budget_id(id)"
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
  clientId: string | null;
  client: BudgetClientDetails;
  items: BudgetClientItem[];
  taxRate?: number;
  status?: BudgetStatus;
}): Promise<void> {
  const {
    budgetId,
    clientId,
    client,
    items,
    taxRate = 0,
    status = "draft",
  } = args;
  const normalizedClientId = (clientId ?? "").trim();

  const { subtotal, tax_amount } = calcBudgetHeaderAmounts(items, taxRate);
  const derivedTitle = deriveBudgetTitle(client);

  const ensuredClientId =
    normalizedClientId && normalizedClientId.toLowerCase() !== "null"
      ? normalizedClientId
      : (
          await createClient({
            name: client.nameOrCompany,
            address_street: client.addressStreet,
            address_postal_code: client.addressPostalCode,
            address_city: client.addressCity,
          })
        ).id;

  // If the client already existed, keep it up to date.
  if (ensuredClientId === normalizedClientId) {
    await updateClientById(ensuredClientId, {
      name: client.nameOrCompany,
      address_street: client.addressStreet,
      address_postal_code: client.addressPostalCode,
      address_city: client.addressCity,
    });
  }

  await updateBudgetById(budgetId, {
    client_id: ensuredClientId,
    title: derivedTitle ?? "",
    job_address: normalizeOptionalString(
      [client.addressStreet, client.addressPostalCode, client.addressCity]
        .map((value) => (value ?? "").trim())
        .filter(Boolean)
        .join(", ")
    ),
    quote_number: normalizeOptionalString(client.quoteNumber),
    document_date: normalizeOptionalString(client.date),
    estimated_time: normalizeOptionalString(client.estimatedTime),
    status,
    subtotal,
    tax_rate: taxRate,
    tax_amount,
  });

  await replaceBudgetLines(budgetId, items);
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
}

export async function saveBudgetWithLines({
  client,
  items,
}: SaveBudgetWithLinesInput): Promise<{ budgetId: string }> {
  // TODO: evolve to findOrCreateClient (avoid duplicates) once we define the matching rules.
  const { id: clientId } = await createClient({
    name: client.nameOrCompany,
    address_street: client.addressStreet,
    address_postal_code: client.addressPostalCode,
    address_city: client.addressCity,
  });
  const { subtotal } = calcBudgetHeaderAmounts(items, 0);
  const { id } = await createBudget({
    client,
    clientId,
    subtotal,
    status: "draft",
  });
  await createBudgetLines({ budgetId: id, items });
  return { budgetId: id };
}
