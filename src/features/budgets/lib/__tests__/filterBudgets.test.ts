import { describe, expect, it } from "vitest";
import type { BudgetListRow } from "@/features/budgets/types/budgetsDb";
import { filterBudgets } from "@/features/budgets/lib/filterBudgets";
import type { BudgetStatus } from "@/features/budgets/lib/budgetStatus";

function makeBudget(overrides: Partial<BudgetListRow> = {}): BudgetListRow {
  return {
    id: "b1",
    title: "Casa Martí",
    quote_number: "2025-01",
    job_address: "Carrer Major 1",
    status: "draft",
    document_date: "2025-03-15",
    created_at: "2025-03-15T10:00:00Z",
    lang: "ca",
    invoice_id: null,
    ...overrides,
  };
}

function baseFilters(
  overrides: Partial<{
    query: string;
    selectedStatuses: Set<BudgetStatus>;
    dateFrom: string;
    dateTo: string;
  }> = {}
) {
  return {
    query: "",
    selectedStatuses: new Set<BudgetStatus>(),
    dateFrom: "",
    dateTo: "",
    ...overrides,
  };
}

describe("filterBudgets", () => {
  describe("query filter", () => {
    it("empty query returns all items", () => {
      const items = [
        makeBudget({ id: "a" }),
        makeBudget({ id: "b", title: "Altre" }),
      ];
      expect(filterBudgets(items, baseFilters({ query: "" }))).toEqual(items);
      expect(filterBudgets(items, baseFilters({ query: "   " }))).toEqual(items);
    });

    it("query matches title returns matching item", () => {
      const items = [makeBudget({ id: "x" }), makeBudget({ id: "y", title: "Oficina Nova" })];
      const result = filterBudgets(items, baseFilters({ query: "Oficina" }));
      expect(result).toEqual([items[1]]);
    });

    it("query matches quote_number returns matching item", () => {
      const items = [
        makeBudget({ id: "x", quote_number: "2025-99" }),
        makeBudget({ id: "y", quote_number: "2025-01" }),
      ];
      const result = filterBudgets(items, baseFilters({ query: "2025-99" }));
      expect(result).toEqual([items[0]]);
    });

    it("query matches job_address returns matching item", () => {
      const items = [
        makeBudget({ id: "x", job_address: "Plaça Nova 3" }),
        makeBudget({ id: "y" }),
      ];
      const result = filterBudgets(items, baseFilters({ query: "Plaça" }));
      expect(result).toEqual([items[0]]);
    });

    it("query is case-insensitive", () => {
      const items = [makeBudget()];
      expect(filterBudgets(items, baseFilters({ query: "casa" }))).toEqual(items);
    });

    it("query matches nothing returns empty array", () => {
      const items = [makeBudget()];
      expect(filterBudgets(items, baseFilters({ query: "xyznonexistent" }))).toEqual([]);
    });
  });

  describe("status filter", () => {
    it("empty selectedStatuses returns all items", () => {
      const items = [
        makeBudget({ id: "a", status: "draft" }),
        makeBudget({ id: "b", status: "sent" }),
      ];
      expect(filterBudgets(items, baseFilters({ selectedStatuses: new Set() }))).toEqual(
        items
      );
    });

    it('selectedStatuses has "draft" returns only draft items', () => {
      const draft = makeBudget({ id: "d", status: "draft" });
      const sent = makeBudget({ id: "s", status: "sent" });
      const items = [draft, sent];
      expect(
        filterBudgets(items, baseFilters({ selectedStatuses: new Set<BudgetStatus>(["draft"]) }))
      ).toEqual([draft]);
    });

    it("selectedStatuses has multiple values returns items matching any", () => {
      const draft = makeBudget({ id: "d", status: "draft" });
      const sent = makeBudget({ id: "s", status: "sent" });
      const approved = makeBudget({ id: "a", status: "approved" });
      const items = [draft, sent, approved];
      expect(
        filterBudgets(
          items,
          baseFilters({
            selectedStatuses: new Set<BudgetStatus>(["draft", "sent"]),
          })
        )
      ).toEqual([draft, sent]);
    });
  });

  describe("date filter", () => {
    it("no dateFrom or dateTo returns all items", () => {
      const items = [
        makeBudget({ id: "a", document_date: "2025-01-01" }),
        makeBudget({ id: "b", document_date: "2025-06-01" }),
      ];
      expect(filterBudgets(items, baseFilters({ dateFrom: "", dateTo: "" }))).toEqual(items);
    });

    it("dateFrom only excludes items before that date", () => {
      const early = makeBudget({ id: "e", document_date: "2025-02-01" });
      const late = makeBudget({ id: "l", document_date: "2025-03-15" });
      const items = [early, late];
      expect(
        filterBudgets(items, baseFilters({ dateFrom: "2025-03-01", dateTo: "" }))
      ).toEqual([late]);
    });

    it("dateTo only excludes items after that date", () => {
      const early = makeBudget({ id: "e", document_date: "2025-02-01" });
      const late = makeBudget({ id: "l", document_date: "2025-03-15" });
      const items = [early, late];
      expect(
        filterBudgets(items, baseFilters({ dateFrom: "", dateTo: "2025-03-01" }))
      ).toEqual([early]);
    });

    it("both dateFrom and dateTo returns only items within range", () => {
      const before = makeBudget({ id: "b", document_date: "2025-02-15" });
      const inside = makeBudget({ id: "i", document_date: "2025-03-15" });
      const after = makeBudget({ id: "a", document_date: "2025-04-15" });
      const items = [before, inside, after];
      expect(
        filterBudgets(
          items,
          baseFilters({ dateFrom: "2025-03-01", dateTo: "2025-03-31" })
        )
      ).toEqual([inside]);
    });

    it("item with null document_date and active date filter is excluded", () => {
      const dated = makeBudget({ id: "d", document_date: "2025-03-15" });
      const undated = makeBudget({ id: "u", document_date: null });
      const items = [dated, undated];
      expect(
        filterBudgets(items, baseFilters({ dateFrom: "2025-01-01", dateTo: "" }))
      ).toEqual([dated]);
    });
  });

  describe("combined filters", () => {
    it("query + status filter applies both (AND logic)", () => {
      const matchQueryDraft = makeBudget({
        id: "qd",
        title: "Casa Vella",
        status: "draft",
      });
      const matchQuerySent = makeBudget({
        id: "qs",
        title: "Casa Nova",
        status: "sent",
      });
      const draftNoQuery = makeBudget({
        id: "dq",
        title: "Magatzem",
        status: "draft",
      });
      const items = [matchQueryDraft, matchQuerySent, draftNoQuery];
      expect(
        filterBudgets(
          items,
          baseFilters({
            query: "Casa",
            selectedStatuses: new Set<BudgetStatus>(["draft"]),
          })
        )
      ).toEqual([matchQueryDraft]);
    });
  });
});
