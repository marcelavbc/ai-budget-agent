import { describe, it, expect, beforeAll, afterEach, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getSupabaseClient } from "@/core/lib/supabaseClient";
import { createContact, getContactById, deleteContactById } from "@/features/contacts/lib/contacts";
import { createBudget, deleteBudgetWithLines, updateBudgetById } from "@/features/budgets/lib/budgets";

const DEV_PROJECT_ID = "exdyjqxxcrwmmblrnfgt";

beforeAll(() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!url.includes(DEV_PROJECT_ID)) {
    throw new Error(
      `Refusing to run integration tests: Supabase URL does not point to the dev project (${DEV_PROJECT_ID}). Got: ${url || "(empty)"}`
    );
  }
});

// Track everything created so we can always clean up, even on failure.
const createdContactIds: string[] = [];
const createdBudgetIds: string[] = [];

afterEach(async () => {
  const supabase = getSupabaseClient();
  // Budgets first (FK depends on contact), then contacts.
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

function testClient(overrides: Partial<{ nameOrCompany: string; quoteNumber: string; date: string; estimatedTime: string; lang: "ca" | "es" }> = {}) {
  return {
    nameOrCompany: "__test__ deleteBudgetWithLines",
    quoteNumber: "",
    date: "",
    estimatedTime: "",
    lang: "ca" as const,
    ...overrides,
  };
}

describe("deleteBudgetWithLines (integration, sanmarti-dev)", () => {
  it("auto-deletes an orphaned contact that only has a name", async () => {
    const contact = await createContact({ name: "__test__ Maria Vila" });
    createdContactIds.push(contact.id);

    const budget = await createBudget({
      client: testClient(),
      contactId: contact.id,
      subtotal: 100,
      status: "draft",
    });
    createdBudgetIds.push(budget.id);

    const result = await deleteBudgetWithLines(budget.id);
    createdBudgetIds.pop(); // already deleted by the function

    expect(result).toEqual({ contactStatus: "deleted_orphan", contactId: contact.id });

    // Verify the contact is really gone, not just that the function said so.
    const supabase = getSupabaseClient();
    const { data } = await supabase.from("contacts").select("id").eq("id", contact.id).maybeSingle();
    expect(data).toBeNull();
    createdContactIds.pop(); // already deleted, nothing for afterEach to clean
  });

  it("returns pending_confirmation for an orphaned contact with a phone number", async () => {
    const contact = await createContact({ name: "__test__ Amanda Call", phone: "600111222" });
    createdContactIds.push(contact.id);

    const budget = await createBudget({
      client: testClient(),
      contactId: contact.id,
      subtotal: 100,
      status: "draft",
    });
    createdBudgetIds.push(budget.id);

    const result = await deleteBudgetWithLines(budget.id);
    createdBudgetIds.pop();

    expect(result).toEqual({ contactStatus: "pending_confirmation", contactId: contact.id });

    // Contact should still exist — verify, then let afterEach clean it up.
    const stillThere = await getContactById(contact.id);
    expect(stillThere.id).toBe(contact.id);
  });

  it("keeps the contact when it still has another budget", async () => {
    const contact = await createContact({ name: "__test__ Two Budgets" });
    createdContactIds.push(contact.id);

    const budgetToDelete = await createBudget({
      client: testClient(),
      contactId: contact.id,
      subtotal: 100,
      status: "draft",
    });
    const budgetToKeep = await createBudget({
      client: testClient(),
      contactId: contact.id,
      subtotal: 200,
      status: "draft",
    });
    createdBudgetIds.push(budgetToKeep.id);

    const result = await deleteBudgetWithLines(budgetToDelete.id);

    expect(result).toEqual({ contactStatus: "kept" });
  });

  it("refuses to delete an invoiced budget", async () => {
    const contact = await createContact({ name: "__test__ Invoiced Block" });
    createdContactIds.push(contact.id);

    const budget = await createBudget({
      client: testClient(),
      contactId: contact.id,
      subtotal: 100,
      status: "draft",
    });
    createdBudgetIds.push(budget.id);

    await updateBudgetById(budget.id, { status: "invoiced" });

    await expect(deleteBudgetWithLines(budget.id)).rejects.toThrow(
      "No es pot eliminar un pressupost facturat."
    );

    // Budget must still exist — verify before afterEach cleans it up.
    const supabase = getSupabaseClient();
    const { data } = await supabase.from("budgets").select("id").eq("id", budget.id).maybeSingle();
    expect(data).not.toBeNull();
  });
});

describe("deleteContactById (integration, sanmarti-dev)", () => {
  it("deletes a contact with no budgets or invoices", async () => {
    const contact = await createContact({ name: "__test__ Clean Contact" });

    await deleteContactById(contact.id);

    const supabase = getSupabaseClient();
    const { data } = await supabase.from("contacts").select("id").eq("id", contact.id).maybeSingle();
    expect(data).toBeNull();
    // Nothing to push to createdContactIds — already deleted, confirmed above.
  });

  it("refuses to delete a contact that has a budget", async () => {
    const contact = await createContact({ name: "__test__ Has Budget" });
    createdContactIds.push(contact.id);

    const budget = await createBudget({
      client: testClient(),
      contactId: contact.id,
      subtotal: 100,
      status: "draft",
    });
    createdBudgetIds.push(budget.id);

    await expect(deleteContactById(contact.id)).rejects.toThrow(
      "No es pot eliminar: el contacte té pressupostos o factures associades."
    );
  });
});
