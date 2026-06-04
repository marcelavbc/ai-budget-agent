import { describe, it, expect, vi, afterEach } from "vitest";
import {
  deleteBudgetWithLines,
  fetchBudgetById,
  getBudgetExportData,
  saveBudgetWithLines,
  updateBudgetWithLines,
} from "./budgetsClient";
import { budgetRowToListRow } from "./budgetRowToListRow";
import { createMockBudgetRow } from "@/features/budgets/test/fixtures/budgetEditRows";

describe("fetchBudgetById", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns BudgetListRow when fetch returns a valid budget", async () => {
    const row = createMockBudgetRow({ id: "budget-1" });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => row,
      })
    );

    const result = await fetchBudgetById("budget-1");

    expect(fetch).toHaveBeenCalledWith("/api/budgets/budget-1", {
      method: "GET",
    });
    expect(result).toEqual(budgetRowToListRow(row));
  });

  it("returns status 404 when fetch returns a 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => null,
      })
    );
    const result = await fetchBudgetById("budget-1");
    expect(result).toBeNull();
  });
  it("returns null when fetch returns a non-200 status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => null,
      })
    );
    const result = await fetchBudgetById("budget-1");
    expect(result).toBeNull();
  });
  it("returns null when fetch returns a non-object", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => "not an object",
      })
    );
    const result = await fetchBudgetById("budget-1");
    expect(result).toBeNull();
  });
  it("returns null when fetch returns a non-string id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: 1 }),
      })
    );
    const result = await fetchBudgetById("budget-1");
    expect(result).toBeNull();
  });
});

type SaveBudgetArgs = Parameters<typeof saveBudgetWithLines>[0];

function saveArgs(overrides: Partial<SaveBudgetArgs> = {}): SaveBudgetArgs {
  return {
    client: {
      nameOrCompany: "Acme SL",
      quoteNumber: "P-2025-01",
      date: "2025-06-01",
      estimatedTime: "3 dies",
      lang: "ca",
    },
    items: [
      {
        id: "item-1",
        title: "Pintura",
        description: "Descripció",
        total: 100,
      },
    ],
    contactId: "contact-1",
    ...overrides,
  };
}

describe("saveBudgetWithLines", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns budgetId and contactId when POST succeeds", async () => {
    const args = saveArgs();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          budgetId: "budget-new",
          contactId: "contact-1",
        }),
      })
    );

    const result = await saveBudgetWithLines(args);

    expect(fetch).toHaveBeenCalledWith("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });
    expect(result).toEqual({
      budgetId: "budget-new",
      contactId: "contact-1",
    });
  });

  it("throws an error when POST fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => null,
      })
    );

    await expect(saveBudgetWithLines(saveArgs())).rejects.toThrow(
      "No s'ha pogut guardar el pressupost."
    );
  });
  it("throws when response omits contactId", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ budgetId: "budget-new" }),
      })
    );

    await expect(saveBudgetWithLines(saveArgs())).rejects.toThrow(
      "No s'ha pogut guardar el pressupost."
    );
  });

  it("throws when response omits budgetId", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ contactId: "contact-1" }),
      })
    );
    await expect(saveBudgetWithLines(saveArgs())).rejects.toThrow(
      "No s'ha pogut guardar el pressupost."
    );
  });
});

type UpdateBudgetArgs = Parameters<typeof updateBudgetWithLines>[0];

function updateArgs(
  overrides: Partial<UpdateBudgetArgs> = {}
): UpdateBudgetArgs {
  const { client, items } = saveArgs();
  return {
    budgetId: "budget-1",
    contactId: "contact-1",
    client,
    items,
    taxRate: 21,
    status: "draft",
    ...overrides,
  };
}

describe("updateBudgetWithLines", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("completes when PUT succeeds", async () => {
    const args = updateArgs();
    const { budgetId, ...body } = args;

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      })
    );

    await expect(updateBudgetWithLines(args)).resolves.toBeUndefined();

    expect(fetch).toHaveBeenCalledWith(`/api/budgets/${budgetId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  });
  it("throws an error when PUT fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => null,
      })
    );
    await expect(updateBudgetWithLines(updateArgs())).rejects.toThrow(
      "No s'ha pogut actualitzar el pressupost."
    );
  });
});

describe("deleteBudgetWithLines", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("completes when DELETE succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => null,
      })
    );
    await expect(deleteBudgetWithLines("budget-1")).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledWith("/api/budgets/budget-1", {
      method: "DELETE",
    });
  });
  it("throws an error when DELETE fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => null,
      })
    );
    await expect(deleteBudgetWithLines("budget-1")).rejects.toThrow(
      "No s'ha pogut eliminar el pressupost."
    );
  });
});

describe("getBudgetExportData", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the export data when GET succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => "export data",
      })
    );
    const result = await getBudgetExportData("budget-1");
    expect(result).toEqual("export data");
    expect(fetch).toHaveBeenCalledWith("/api/budgets/budget-1/export", {
      method: "GET",
    });
  });
  it("throws an error when GET fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => null,
      })
    );
    await expect(getBudgetExportData("budget-1")).rejects.toThrow(
      "No s'ha pogut exportar el pressupost."
    );
  });
});
