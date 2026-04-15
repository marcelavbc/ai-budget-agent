import { NextResponse } from "next/server";
import { buildBudgetText } from "@/lib/buildBudgetText";
import { calculateBudget } from "@/lib/calculateBudget";
import { parseJobDescription } from "@/lib/parseJobDescription";
import { parseJobDescriptionWithAI } from "@/lib/parseJobDescriptionWithAI";
import { estimateArea } from "@/lib/estimateArea";
import type { BudgetRequest, BudgetResponse } from "@/types/budget";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BudgetRequest;
    const description = body.description?.trim();

    if (!description) {
      return NextResponse.json(
        { error: "Cal indicar una descripció del treball." },
        { status: 400 },
      );
    }

    let parsedJob;
    let usedEstimatedArea = false;

    try {
      parsedJob = await parseJobDescriptionWithAI(description);
    } catch {
      parsedJob = parseJobDescription(description);
    }

    if (!parsedJob.areaM2) {
      const estimatedArea = estimateArea(description);

      if (estimatedArea) {
        parsedJob.areaM2 = estimatedArea;
        usedEstimatedArea = true;
      }
    }

    const breakdown = calculateBudget(parsedJob);
    const budgetText = buildBudgetText(parsedJob, breakdown);

    const errors: string[] = [];

    if (!parsedJob.areaM2) {
      errors.push("No hem pogut detectar els metres quadrats.");
    }

    if (!parsedJob.wallCondition) {
      errors.push("No hem pogut detectar l’estat de les parets.");
    }

    if (usedEstimatedArea) {
      errors.push("Hem estimat els metres quadrats de manera aproximada.");
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