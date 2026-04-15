import { NextResponse } from "next/server";
import { buildBudgetText } from "@/lib/buildBudgetText";
import { calculateBudget } from "@/lib/calculateBudget";
import { parseJobDescription } from "@/lib/parseJobDescription";
import type { BudgetRequest, BudgetResponse } from "@/types/budget";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BudgetRequest;
    const description = body.description?.trim();

    if (!description) {
      return NextResponse.json(
        { error: "Cal una descripció del treball." },
        { status: 400 },
      );
    }

    const parsedJob = parseJobDescription(description);
    const breakdown = calculateBudget(parsedJob);
    const budgetText = buildBudgetText(parsedJob, breakdown);

    const errors: string[] = [];

    if (!parsedJob.areaM2) {
      errors.push("No s’ha pogut detectar la superfície en m².");
    }

    if (!parsedJob.wallCondition) {
      errors.push("No s’ha pogut detectar l’estat de les parets.");
    }

    const response: BudgetResponse = {
      parsedJob,
      breakdown,
      budgetText,
      errors: errors.length ? errors : undefined,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "S’ha produït un error en generar el pressupost." },
      { status: 500 },
    );
  }
}
