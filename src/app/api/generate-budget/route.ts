import { NextResponse } from "next/server";
import { buildBudgetText } from "@/lib/buildBudgetText";
import { calculateBudget } from "@/lib/calculateBudget";
import { parseJobDescription } from "@/lib/parseJobDescription";
import { parseJobDescriptionWithAI } from "@/lib/parseJobDescriptionWithAI";
import { estimateArea } from "@/lib/estimateArea";
import { extractExcludedArea } from "@/lib/extractExcludedArea";
import type { BudgetRequest, BudgetResponse } from "@/types/budget";

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

    let parsedJob;
    let usedEstimatedArea = false;
    let usedExclusion = false;

    // 1. Parse (AI + fallback)
    try {
      parsedJob = await parseJobDescriptionWithAI(description);
    } catch {
      parsedJob = parseJobDescription(description);
    }

    // 2. Fallback area estimation
    if (!parsedJob.areaM2) {
      const estimatedArea = estimateArea(description);

      if (estimatedArea) {
        parsedJob.areaM2 = estimatedArea;
        usedEstimatedArea = true;
      }
    }

    // 3. Apply exclusions
    if (parsedJob.areaM2) {
      const excluded = extractExcludedArea(description);

      if (excluded > 0) {
        parsedJob.areaM2 = parsedJob.areaM2 - excluded;
        usedExclusion = true;
      }
    }

    // 4. Calculate
    const breakdown = calculateBudget(parsedJob);

    // 5. Build text
    const budgetText = buildBudgetText(parsedJob, breakdown);

    // 6. Errors / warnings
    const errors: string[] = [];

    if (!parsedJob.areaM2) {
      errors.push("No hem pogut detectar els metres quadrats.");
    }

    if (usedEstimatedArea) {
      errors.push("Hem estimat els metres quadrats de manera aproximada.");
    }

    if (usedExclusion) {
      errors.push("S’ha descomptat una part de la superfície indicada.");
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
      { status: 500 }
    );
  }
}
