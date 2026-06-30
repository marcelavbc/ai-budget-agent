import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getSupabaseClient } from "@/core/lib/supabaseClient";
import { createContact, getContactById } from "@/features/contacts/lib/contacts";
import {
  createBudget,
  getBudgetById,
  saveBudgetWithLines,
  updateBudgetById,
  updateBudgetWithLines,
} from "@/features/budgets/lib/budgets";
import type { BudgetClientItem } from "@/features/budgets/types/budget";

const DEV_PROJECT_ID = "exdyjqxxcrwmmblrnfgt";

beforeAll(() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!url.includes(DEV_PROJECT_ID)) {
    throw new Error(
      `Refusing to run integration tests: Supabase URL does not point to the dev project (${DEV_PROJECT_ID}). Got: ${url || "(empty)"}`
    );
  }
});

const createdContactIds: string[] = [];
const createdBudgetIds: string[] = [];

afterEach(async () => {
  const supabase = getSupabaseClient();
  for (const budgetId of createdBudgetIds) {
    await supabase.from("budget_lines").delete().eq("budget_id", budgetId);
    await supabase.from("budgets").delete().eq("id", budgetId);
  }
  createdBudgetIds.length = 0;
  for (const contactId of createdContactIds) {
    await supabase.from("contacts").delete().eq("id", contactId);
  }
  createdContactIds.length = 0;
});

function testClient(
  overrides: Partial<{
    nameOrCompany: string;
    quoteNumber: string;
    date: string;
    estimatedTime: string;
    lang: "ca" | "es";
  }> = {}
) {
  return {
    nameOrCompany: "__test__ budgetClientIdentity",
    quoteNumber: "",
    date: "",
    estimatedTime: "",
    lang: "ca" as const,
    ...overrides,
  };
}

function testItems(): BudgetClientItem[] {
  return [
    {
      id: "line-1",
      title: "Pintura",
      description: "Integration test line",
      quantity: 1,
      unitLabel: "partida",
      unitPrice: 100,
      total: 100,
    },
  ];
}

describe("budget client identity (integration, sanmarti-dev)", () => {
  it("saveBudgetWithLines does not sync the contact name from the budget", async () => {
    const contact = await createContact({ name: "__test__ Original Name" });
    createdContactIds.push(contact.id);

    const saved = await saveBudgetWithLines({
      client: testClient({ nameOrCompany: "__test__ Different Budget Name" }),
      items: testItems(),
      contactId: contact.id,
    });
    createdBudgetIds.push(saved.budgetId);

    const fetched = await getContactById(contact.id);
    expect(fetched.name).toBe("__test__ Original Name");
  });

  it("updateBudgetWithLines does not sync the contact name from the budget", async () => {
    const contact = await createContact({ name: "__test__ Original Name" });
    createdContactIds.push(contact.id);

    const budget = await createBudget({
      client: testClient(),
      contactId: contact.id,
      subtotal: 100,
      status: "draft",
    });
    createdBudgetIds.push(budget.id);

    await updateBudgetWithLines({
      budgetId: budget.id,
      contactId: contact.id,
      client: testClient({ nameOrCompany: "__test__ Different Budget Name" }),
      items: testItems(),
    });

    const fetched = await getContactById(contact.id);
    expect(fetched.name).toBe("__test__ Original Name");
  });

  it("two budgets for the same contact keep independent client_name after editing one of them", async () => {
    const contact = await createContact({ name: "__test__ Jordi" });
    createdContactIds.push(contact.id);

    const barcelonaBudget = await createBudget({
      client: testClient({ nameOrCompany: "Jordi - Barcelona" }),
      contactId: contact.id,
      subtotal: 100,
      status: "draft",
    });
    const terrassaBudget = await createBudget({
      client: testClient({ nameOrCompany: "Jordi - Terrassa" }),
      contactId: contact.id,
      subtotal: 200,
      status: "draft",
    });
    createdBudgetIds.push(barcelonaBudget.id, terrassaBudget.id);

    await updateBudgetWithLines({
      budgetId: barcelonaBudget.id,
      contactId: contact.id,
      client: testClient({ nameOrCompany: "Jordi - Barcelona (obra nova)" }),
      items: testItems(),
    });

    const barcelonaRow = await getBudgetById(barcelonaBudget.id);
    const terrassaRow = await getBudgetById(terrassaBudget.id);

    expect(barcelonaRow?.client_name).toBe("Jordi - Barcelona (obra nova)");
    expect(terrassaRow?.client_name).toBe("Jordi - Terrassa");
  });

  it("approved budget's client field is editable (not locked)", async () => {
    const contact = await createContact({ name: "__test__ Approved Client" });
    createdContactIds.push(contact.id);

    const budget = await createBudget({
      client: testClient({ nameOrCompany: "__test__ Approved Client" }),
      contactId: contact.id,
      subtotal: 100,
      status: "draft",
    });
    createdBudgetIds.push(budget.id);

    await updateBudgetById(budget.id, { status: "approved" });

    await updateBudgetWithLines({
      budgetId: budget.id,
      contactId: contact.id,
      client: testClient({ nameOrCompany: "__test__ Approved Renamed" }),
      items: testItems(),
      status: "approved",
    });

    const updated = await getBudgetById(budget.id);
    expect(updated?.status).toBe("approved");
    expect(updated?.client_name).toBe("__test__ Approved Renamed");
  });
});
