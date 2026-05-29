import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/core/lib/supabaseClient";

type ContactAddressRow = {
  id: string;
  street: string | null;
  postal_code: string | null;
  city: string | null;
  label: string | null;
  created_at: string;
};

type ContactSearchRow = {
  id: string;
  name: string;
  fiscal_address_street: string | null;
  fiscal_address_postal_code: string | null;
  fiscal_address_city: string | null;
  contact_addresses: ContactAddressRow[] | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (q.length < 2) {
    return NextResponse.json([]);
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("contacts")
    .select(
      "id, name, fiscal_address_street, fiscal_address_postal_code, fiscal_address_city, contact_addresses(id, street, postal_code, city, label, created_at)"
    )
    .ilike("name", `%${q}%`)
    .limit(5);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = ((data ?? []) as ContactSearchRow[]).map(
    ({ contact_addresses, ...contact }) => ({
      ...contact,
      addresses: [...(contact_addresses ?? [])]
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .map(({ id, street, postal_code, city, label }) => ({
          id,
          street,
          postal_code,
          city,
          label,
        })),
    })
  );

  return NextResponse.json(results);
}
