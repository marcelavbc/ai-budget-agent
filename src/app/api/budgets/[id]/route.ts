import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { BudgetClientDetails, BudgetClientItem } from "@/features/budgets/types/budget";
import type { BudgetStatus } from "@/features/budgets/lib/budgetStatus";
import {
  deleteBudgetWithLines,
  getBudgetById,
  updateBudgetById,
  updateBudgetWithLines,
} from "@/features/budgets/lib/budgets";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const row = await getBudgetById(id);
    if (!row) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: "Fetch failed." }, { status: 500 });
  }
}

type PutBody = {
  contactId: string | null;
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
    const { contactId, client, items, taxRate, status } = body;
    if (!client || !Array.isArray(items)) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    await updateBudgetWithLines({
      budgetId: id,
      contactId: contactId ?? null,
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

