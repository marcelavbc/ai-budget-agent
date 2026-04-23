import { supabase } from "@/lib/supabaseClient";
import type { BudgetClientDetails, BudgetClientItem } from "@/types/budget";

export type BudgetStatus = "draft";

export type BudgetRow = {
  id: string;
  client_id: string;
  title: string | null;
  job_address: string | null;
  quote_number: string | null;
  document_date: string | null;
  estimated_time: string | null;
  status: string | null;
  notes: string | null;
  subtotal: number | null;
  tax_rate: number | null;
  tax_amount: number | null;
  total: number | null;
};

export type BudgetLineRow = {
  id: string;
  budget_id: string;
  title: string | null;
  description: string | null;
  quantity: number | null;
  unit: string | null;
  unit_price: number | null;
  line_total: number | null;
  sort_order: number | null;
};

export type BudgetListRow = {
  id: string;
  title: string | null;
  job_address: string | null;
  quote_number: string | null;
  document_date: string | null;
  status: string | null;
  total: number | null;
  created_at: string | null;
};

export type ClientRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
};

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
  email: string;
  phone?: string | null;
  address?: string | null;
}

export async function createClient({
  name,
  email,
  phone = null,
  address = null,
}: CreateClientInput): Promise<{ id: string }> {
  const normalizedName = name.trim();
  const normalizedEmail = email.trim();
  const normalizedPhone = (phone ?? "").trim();
  const normalizedAddress = (address ?? "").trim();

  const { data, error } = await supabase
    .from("clients")
    .insert([
      {
        name: normalizedName,
        email: normalizedEmail.length > 0 ? normalizedEmail : null,
        phone: normalizedPhone.length > 0 ? normalizedPhone : null,
        address: normalizedAddress.length > 0 ? normalizedAddress : null,
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
  patch: Partial<Pick<ClientRow, "name" | "email" | "phone" | "address">>
): Promise<void> {
  const normalized = {
    name: typeof patch.name === "string" ? patch.name.trim() : patch.name,
    email: typeof patch.email === "string" ? patch.email.trim() : patch.email,
    phone: typeof patch.phone === "string" ? patch.phone.trim() : patch.phone,
    address:
      typeof patch.address === "string" ? patch.address.trim() : patch.address,
  };

  const { error } = await supabase.from("clients").update(normalized).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getClientById(id: string): Promise<ClientRow> {
  const { data, error } = await supabase
    .from("clients")
    .select("id,name,email,phone,address")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data as ClientRow;
}

export async function createBudget({
  client,
  clientId,
  status = "draft",
  subtotal,
  taxRate = 0,
}: CreateBudgetInput): Promise<CreateBudgetResult> {
  const tax_amount = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const total = Math.round((subtotal + tax_amount) * 100) / 100;

  const derivedTitle = (() => {
    const name = client.nameOrCompany.trim();
    const addr = client.address.trim();
    if (name.length > 0) return `Pressupost - ${name}`;
    if (addr.length > 0) return `Pressupost - ${addr}`;
    return null;
  })();

  const { data, error } = await supabase
    .from("budgets")
    .insert([
      {
        client_id: clientId,
        title: derivedTitle,
        job_address: client.address.trim().length > 0 ? client.address : null,
        quote_number: client.quoteNumber.trim().length > 0 ? client.quoteNumber : null,
        document_date: client.date.trim().length > 0 ? client.date : null,
        estimated_time:
          client.estimatedTime.trim().length > 0 ? client.estimatedTime : null,
        status,
        notes: null,
        subtotal,
        tax_rate: taxRate,
        tax_amount,
        total,
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

export async function getBudgetById(id: string): Promise<BudgetRow> {
  const { data, error } = await supabase
    .from("budgets")
    .select(
      "id,client_id,title,job_address,quote_number,document_date,estimated_time,status,notes,subtotal,tax_rate,tax_amount,total"
    )
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data as BudgetRow;
}

export async function updateBudgetById(
  id: string,
  patch: Partial<
    Pick<
      BudgetRow,
      | "title"
      | "job_address"
      | "quote_number"
      | "document_date"
      | "estimated_time"
      | "status"
      | "subtotal"
      | "tax_rate"
      | "tax_amount"
      | "total"
    >
  >
): Promise<void> {
  const normalized = {
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
    status: typeof patch.status === "string" ? patch.status.trim() : patch.status,
    subtotal: patch.subtotal,
    tax_rate: patch.tax_rate,
    tax_amount: patch.tax_amount,
    total: patch.total,
  };

  const { error } = await supabase.from("budgets").update(normalized).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getBudgets(): Promise<BudgetListRow[]> {
  const { data, error } = await supabase
    .from("budgets")
    .select("id,title,job_address,status,document_date,quote_number,total,created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as BudgetListRow[];
}

export async function deleteBudgetLines(budgetId: string): Promise<void> {
  const { error } = await supabase.from("budget_lines").delete().eq("budget_id", budgetId);
  if (error) throw new Error(error.message);
}

export async function deleteBudgetById(budgetId: string): Promise<void> {
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
  const rows = items.map((item, idx) => ({
    budget_id: budgetId,
    title: item.title.trim().length > 0 ? item.title.trim() : null,
    description: item.description.trim().length > 0 ? item.description.trim() : null,
    quantity: item.quantity ?? 1,
    unit:
      (item.unitLabel ?? "").trim().length > 0 ? (item.unitLabel ?? "").trim() : null,
    unit_price: item.unitPrice ?? null,
    line_total: item.total,
    sort_order: idx,
  }));

  await deleteBudgetLines(budgetId);
  const { error } = await supabase.from("budget_lines").insert(rows);
  if (error) throw new Error(error.message);
}

export async function updateBudgetWithLines(args: {
  budgetId: string;
  clientId: string;
  client: BudgetClientDetails;
  items: BudgetClientItem[];
  taxRate?: number;
  status?: BudgetStatus;
}): Promise<void> {
  const { budgetId, clientId, client, items, taxRate = 0, status = "draft" } = args;

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax_amount = Math.round(subtotal * (taxRate / 100) * 100) / 100;
  const total = Math.round((subtotal + tax_amount) * 100) / 100;

  const derivedTitle = (() => {
    const name = client.nameOrCompany.trim();
    const addr = client.address.trim();
    if (name.length > 0) return `Pressupost - ${name}`;
    if (addr.length > 0) return `Pressupost - ${addr}`;
    return null;
  })();

  await updateClientById(clientId, {
    name: client.nameOrCompany,
    email: client.email,
    address: client.address,
  });

  await updateBudgetById(budgetId, {
    title: derivedTitle,
    job_address: client.address.trim().length > 0 ? client.address : null,
    quote_number: client.quoteNumber.trim().length > 0 ? client.quoteNumber : null,
    document_date: client.date.trim().length > 0 ? client.date : null,
    estimated_time: client.estimatedTime.trim().length > 0 ? client.estimatedTime : null,
    status,
    subtotal,
    tax_rate: taxRate,
    tax_amount,
    total,
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
  const rows = items.map((item, idx) => ({
    budget_id: budgetId,
    title: item.title.trim().length > 0 ? item.title.trim() : null,
    description: item.description.trim().length > 0 ? item.description.trim() : null,
    quantity: item.quantity ?? 1,
    unit:
      (item.unitLabel ?? "").trim().length > 0 ? (item.unitLabel ?? "").trim() : null,
    unit_price: item.unitPrice ?? null,
    line_total: item.total,
    sort_order: idx,
  }));

  const { error } = await supabase.from("budget_lines").insert(rows);
  if (error) {
    throw new Error(error.message);
  }
}

export async function getBudgetLinesByBudgetId(
  budgetId: string
): Promise<BudgetLineRow[]> {
  const { data, error } = await supabase
    .from("budget_lines")
    .select(
      "id,budget_id,title,description,quantity,unit,unit_price,line_total,sort_order"
    )
    .eq("budget_id", budgetId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as BudgetLineRow[];
}

export interface SaveBudgetWithLinesInput {
  client: BudgetClientDetails;
  items: BudgetClientItem[];
  subtotal: number;
}

export async function saveBudgetWithLines({
  client,
  items,
  subtotal,
}: SaveBudgetWithLinesInput): Promise<{ budgetId: string }> {
  // TODO: evolve to findOrCreateClient (avoid duplicates) once we define the matching rules.
  const { id: clientId } = await createClient({
    name: client.nameOrCompany,
    email: client.email,
    address: client.address,
  });
  const { id } = await createBudget({ client, clientId, subtotal, status: "draft" });
  await createBudgetLines({ budgetId: id, items });
  return { budgetId: id };
}

