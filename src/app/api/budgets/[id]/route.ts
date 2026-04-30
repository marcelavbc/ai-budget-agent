import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { BudgetClientDetails, BudgetClientItem } from "@/types/budget";
import type { BudgetStatus } from "@/lib/budgetStatus";
import { deleteBudgetWithLines, updateBudgetById, updateBudgetWithLines } from "@/lib/budgets";

type PutBody = {
  clientId: string | null;
  client: BudgetClientDetails;
  items: BudgetClientItem[];
  taxRate?: number;
  status?: BudgetStatus;
};

type PatchBody = Parameters<typeof updateBudgetById>[1];

export async function PUT(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = (await _request.json()) as PutBody;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const { clientId, client, items, taxRate, status } = body;
    if (!client || !Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    await updateBudgetWithLines({
      budgetId: id,
      clientId: clientId ?? null,
      client,
      items,
      taxRate,
      status,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const patch = (await request.json()) as PatchBody;
    if (!patch || typeof patch !== "object") {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    await updateBudgetById(id, patch);
    revalidatePath("/budgets");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    await deleteBudgetWithLines(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete failed." }, { status: 500 });
  }
}

