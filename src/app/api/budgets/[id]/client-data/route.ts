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
    .select("contact_id")
    .eq("id", id)
    .maybeSingle();

  if (!budget?.contact_id) {
    return NextResponse.json(null);
  }

  const { data: contact } = await supabase
    .from("contacts")
    .select(
      "tax_id,fiscal_address_street,fiscal_address_postal_code,fiscal_address_city"
    )
    .eq("id", budget.contact_id)
    .maybeSingle();

  return NextResponse.json(contact ?? null);
}
