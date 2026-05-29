import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/core/lib/supabaseClient";

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
      "id, name, fiscal_address_street, fiscal_address_postal_code, fiscal_address_city"
    )
    .ilike("name", `%${q}%`)
    .limit(5);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
