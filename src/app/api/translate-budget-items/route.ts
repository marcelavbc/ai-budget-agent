import { NextResponse } from "next/server";
import type { BudgetClientItem } from "@/features/budgets/types/budget";
import { translateBudgetItems } from "@/features/budgets/lib/translateBudgetItems";

type Body = { items: BudgetClientItem[]; targetLang: "ca" | "es" };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const items = Array.isArray(body.items) ? body.items : null;
    const targetLang = body.targetLang;

    if (!items || (targetLang !== "ca" && targetLang !== "es")) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const translated = await translateBudgetItems(items, targetLang);
    return NextResponse.json({ items: translated });
  } catch {
    return NextResponse.json({ error: "Translation failed." }, { status: 500 });
  }
}

