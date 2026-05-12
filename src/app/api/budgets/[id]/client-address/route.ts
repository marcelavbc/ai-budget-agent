import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/core/lib/supabaseClient";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await req.json()) as Record<string, unknown>;
  const supabase = getSupabaseClient();

  const { data: budget } = await supabase
    .from("budgets")
    .select("client_id")
    .eq("id", id)
    .maybeSingle();

  if (!budget?.client_id) {
    return NextResponse.json({ error: "Client no trobat" }, { status: 404 });
  }

  const patch: {
    address_street?: string;
    address_postal_code?: string;
    address_city?: string;
  } = {};
  if (typeof body.address_street === "string")
    patch.address_street = body.address_street.trim();
  if (typeof body.address_postal_code === "string")
    patch.address_postal_code = body.address_postal_code.trim();
  if (typeof body.address_city === "string")
    patch.address_city = body.address_city.trim();

  const { error } = await supabase
    .from("clients")
    .update(patch)
    .eq("id", budget.client_id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
