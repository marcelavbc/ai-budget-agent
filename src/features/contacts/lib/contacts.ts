import "server-only";

import { getSupabaseClient } from "@/core/lib/supabaseClient";
import type { Tables } from "@/core/types/supabase";

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
  patch: Partial<Pick<ContactRow, "name" | "phone">>
): Promise<void> {
  const supabase = getSupabaseClient();
  const normalized = {
    name: typeof patch.name === "string" ? patch.name.trim() : patch.name,
    phone: typeof patch.phone === "string" ? patch.phone.trim() : patch.phone,
  };

  const { error } = await supabase
    .from("contacts")
    .update(normalized)
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
