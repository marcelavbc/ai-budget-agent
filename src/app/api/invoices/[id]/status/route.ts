import { getSupabaseClient } from "@/core/lib/supabaseClient";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id?: string }> }
) {
  try {
    const { id: rawId } = await params;
    const id = rawId ?? "";
    const body = await request.json().catch(() => ({}));
    const status = typeof body?.status === "string" ? body.status : "";

    if (!id || !id.trim() || status !== "paid") {
      return new Response(JSON.stringify({ error: "Invalid request." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("invoices")
      .update({ status })
      .eq("id", id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unexpected error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
