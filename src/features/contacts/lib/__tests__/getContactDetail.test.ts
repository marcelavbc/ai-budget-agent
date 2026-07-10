import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { buildContactDetailTotals } from "@/features/contacts/lib/contacts";

describe("buildContactDetailTotals", () => {
  it("returns empty counts and zero totals with no budgets or invoices", () => {
    expect(buildContactDetailTotals([], [])).toEqual({
      budgetCountByStatus: {},
      totalIssued: 0,
      totalPaid: 0,
    });
  });

  it("counts budgets by status", () => {
    const budgets = [
      { status: "draft" },
      { status: "draft" },
      { status: "invoiced" },
    ];

    expect(buildContactDetailTotals(budgets, [])).toEqual({
      budgetCountByStatus: { draft: 2, invoiced: 1 },
      totalIssued: 0,
      totalPaid: 0,
    });
  });

  it("sums totalIssued across all invoices and totalPaid only for paid", () => {
    const invoices = [
      { status: "issued", total: 100 },
      { status: "paid", total: 50 },
      { status: "draft", total: 25 },
      { status: "paid", total: 75 },
    ];

    expect(buildContactDetailTotals([], invoices)).toEqual({
      budgetCountByStatus: {},
      totalIssued: 250,
      totalPaid: 125,
    });
  });

  it("treats non-numeric invoice totals as 0", () => {
    const invoices = [
      { status: "issued", total: null as unknown as number },
      { status: "paid", total: undefined as unknown as number },
      { status: "paid", total: 40 },
    ];

    expect(buildContactDetailTotals([], invoices)).toEqual({
      budgetCountByStatus: {},
      totalIssued: 40,
      totalPaid: 40,
    });
  });

  it("rounds totals to 2 decimal places without floating-point drift", () => {
    const invoices = [
      { status: "issued", total: 10.005 },
      { status: "issued", total: 10.005 },
    ];

    const result = buildContactDetailTotals([], invoices);

    expect(result.totalIssued).toBe(20.01);
    expect(result.totalPaid).toBe(0);
  });
});
