import { NextResponse } from "next/server";
import { createInvoiceFromBudget } from "@/features/invoices/lib/invoices";

type Body = {
  budgetId: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const budgetId = typeof body.budgetId === "string" ? body.budgetId : "";
    if (!budgetId.trim()) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const { invoiceId } = await createInvoiceFromBudget(budgetId);
    return NextResponse.json({ invoiceId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    return NextResponse.json(
      { error: msg || "No s'ha pogut generar la factura." },
      { status: 500 }
    );
  }
}
