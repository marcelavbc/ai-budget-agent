import { NextResponse } from "next/server";
import {
  getBudgetById,
  getBudgetLinesByBudgetId,
} from "@/features/budgets/lib/budgets";
import { getContactById } from "@/features/contacts/lib/contacts";
import { resolveBudgetClientIdentity } from "@/features/budgets/lib/resolveBudgetClientIdentity";

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

    const identity = resolveBudgetClientIdentity(budget, contact);
    const client = {
      ...contact,
      name: identity.name,
      tax_id: identity.tax_id,
      fiscal_address_street: identity.fiscal_address_street,
      fiscal_address_postal_code: identity.fiscal_address_postal_code,
      fiscal_address_city: identity.fiscal_address_city,
    };

    return NextResponse.json({ budget, client, lines });
  } catch {
    return NextResponse.json({ error: "Export failed." }, { status: 500 });
  }
}

