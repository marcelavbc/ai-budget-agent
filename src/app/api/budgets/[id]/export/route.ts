import { NextResponse } from "next/server";
import {
  getBudgetById,
  getBudgetLinesByBudgetId,
} from "@/features/budgets/lib/budgets";
import { getContactById } from "@/features/contacts/lib/contacts";

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

    const [contact, lines] = await Promise.all([
      getContactById(budget.contact_id),
      getBudgetLinesByBudgetId(budget.id),
    ]);

    return NextResponse.json({ budget, client: contact, lines });
  } catch {
    return NextResponse.json({ error: "Export failed." }, { status: 500 });
  }
}

