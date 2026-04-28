import { NextResponse } from "next/server";
import type { BudgetClientDetails, BudgetClientItem } from "@/types/budget";
import { saveBudgetWithLines } from "@/lib/budgets";

type Body = {
  client: BudgetClientDetails;
  items: BudgetClientItem[];
  subtotal: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const { client, items, subtotal } = body;
    if (!client || !Array.isArray(items) || typeof subtotal !== "number") {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const { budgetId } = await saveBudgetWithLines({ client, items, subtotal });
    return NextResponse.json({ budgetId });
  } catch {
    return NextResponse.json(
      { error: "No s'ha pogut guardar el pressupost." },
      { status: 500 }
    );
  }
}

