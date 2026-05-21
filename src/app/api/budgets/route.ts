import { NextResponse } from "next/server";
import type { BudgetClientDetails, BudgetClientItem } from "@/features/budgets/types/budget";
import { saveBudgetWithLines } from "@/features/budgets/lib/budgets";

type Body = {
  client: BudgetClientDetails;
  items: BudgetClientItem[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const { client, items } = body;
    if (!client || !Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const { budgetId } = await saveBudgetWithLines({ client, items });
    return NextResponse.json({ budgetId });
  } catch (e) {
    console.error("POST /api/budgets failed:", e);
    const message =
      e instanceof Error
        ? e.message
        : "No s'ha pogut guardar el pressupost.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

