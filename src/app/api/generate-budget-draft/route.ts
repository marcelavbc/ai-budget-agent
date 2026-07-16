import { NextResponse } from "next/server";
import { buildBudgetDraftFromAI } from "@/features/budgets/lib/buildBudgetDraftFromAI";
import type { BudgetRequest } from "@/features/budgets/types/budget";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BudgetRequest;
    const description = body.description?.trim();

    if (!description) {
      return NextResponse.json(
        { error: "Cal indicar una descripció del treball." },
        { status: 400 }
      );
    }

    const lines = await buildBudgetDraftFromAI(description);

    return NextResponse.json({
      lines,
    });
  } catch {
    return NextResponse.json(
      { error: "S’ha produït un error en generar el pressupost." },
      { status: 500 }
    );
  }
}
