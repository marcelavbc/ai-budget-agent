import { NextResponse } from "next/server";
import {
  getBudgetById,
  getBudgetLinesByBudgetId,
  getClientById,
} from "@/features/budgets/lib/budgets";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const budget = await getBudgetById(id);
    if (!budget) {
      return NextResponse.json(
        { error: "No s'ha trobat el pressupost." },
        { status: 404 }
      );
    }

    const [client, lines] = await Promise.all([
      getClientById(budget.client_id),
      getBudgetLinesByBudgetId(budget.id),
    ]);

    return NextResponse.json({ budget, client, lines });
  } catch {
    return NextResponse.json({ error: "Export failed." }, { status: 500 });
  }
}

