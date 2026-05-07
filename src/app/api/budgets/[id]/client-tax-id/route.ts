import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/core/lib/supabaseClient";
import { getBudgetById } from "@/features/budgets/lib/budgets";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const taxId = typeof body.taxId === "string" ? body.taxId.trim() : "";
    if (!taxId) {
      return NextResponse.json({ error: "NIF/NIE obligatori." }, { status: 400 });
    }

    const budget = await getBudgetById(id);
    if (!budget?.client_id) {
      return NextResponse.json({ error: "Client no trobat." }, { status: 404 });
    }

    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("clients")
      .update({ tax_id: taxId })
      .eq("id", budget.client_id);

    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    return NextResponse.json(
      { error: msg || "No s'ha pogut guardar el NIF." },
      { status: 500 }
    );
  }
}
