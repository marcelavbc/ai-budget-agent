import { NextResponse } from "next/server";
import { buildBudgetDraftFromAI } from "@/lib/buildBudgetDraftFromAI";
import type { BudgetRequest, BudgetLine } from "@/types/budget";

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

    const total =
      lines.length > 0
        ? lines.reduce(
            (sum: number, line: BudgetLine) => sum + line.subtotal,
            0
          )
        : null;

    return NextResponse.json({
      lines,
      total,
    });
  } catch {
    return NextResponse.json(
      { error: "S’ha produït un error en generar l’esborrany." },
      { status: 500 }
    );
  }
}
