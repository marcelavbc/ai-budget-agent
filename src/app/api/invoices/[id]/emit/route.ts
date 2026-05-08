import { NextResponse } from "next/server";
import { emitInvoice } from "@/features/invoices/lib/invoices";

type RouteContext = {
  params: Promise<{ id?: string }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const { id: rawId } = await params;
    const id = typeof rawId === "string" ? rawId.trim() : "";

    if (!id) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    await emitInvoice(id);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
