import { NextResponse } from "next/server";
import { createInvoiceFromBudget } from "@/features/invoices/lib/invoices";
import { isInvoicePricingMode } from "@/features/invoices/types/invoice";

type Body = {
  budgetId: string;
  pricingMode?: unknown;
  issueDate?: unknown;
  dueDate?: unknown;
  taxRate?: unknown;
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

    const pricingMode =
      typeof body.pricingMode === "string" ? body.pricingMode.trim() : "";
    if (!isInvoicePricingMode(pricingMode)) {
      return NextResponse.json(
        { error: "Cal especificar pricingMode: without_iva o with_iva." },
        { status: 400 }
      );
    }

    const issueDate =
      typeof body.issueDate === "string" ? body.issueDate.trim() : undefined;
    const dueDate =
      typeof body.dueDate === "string" ? body.dueDate.trim() : undefined;
    const taxRate =
      typeof body.taxRate === "number" && Number.isFinite(body.taxRate)
        ? body.taxRate
        : undefined;

    const { invoiceId } = await createInvoiceFromBudget(
      budgetId,
      pricingMode,
      issueDate || undefined,
      dueDate || undefined,
      taxRate
    );
    return NextResponse.json({ invoiceId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    return NextResponse.json(
      { error: msg || "No s'ha pogut generar la factura." },
      { status: 500 }
    );
  }
}
