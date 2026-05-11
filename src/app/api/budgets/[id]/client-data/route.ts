import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/core/lib/supabaseClient";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseClient();

  const { data: budget } = await supabase
    .from("budgets")
    .select("client_id")
    .eq("id", id)
    .maybeSingle();

  if (!budget?.client_id) {
    return NextResponse.json(null);
  }

  const { data: client } = await supabase
    .from("clients")
    .select("tax_id,address_street,address_postal_code,address_city")
    .eq("id", budget.client_id)
    .maybeSingle();

  return NextResponse.json(client ?? null);
}
