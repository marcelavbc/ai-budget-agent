import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/core/lib/supabaseClient";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const contactId = id.trim();

  if (!contactId) {
    return NextResponse.json({ error: "Invalid contact id." }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("contact_addresses")
    .select("id, street, postal_code, city, label, created_at")
    .eq("contact_id", contactId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
