// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import type { ChangeEvent } from "react";
import { describe, expect, it } from "vitest";
import { useBudgetsListFilters } from "./useBudgetsListFilters";
import {
  createMockBudgetRow,
  mockBudgetRow,
  mockBudgetRowTwo,
} from "../test/fixtures/budgetEditRows";
import { startOfMonth, toYMD } from "@/shared/lib/dateUtils";

describe("useBudgetsListFilters", () => {
  it("filters budgets by search query", () => {
    const { result } = renderHook(() =>
      useBudgetsListFilters([mockBudgetRow, mockBudgetRowTwo])
    );
    act(() => {
      result.current.searchInputProps.onChange({
        target: { value: "Test Item Two" },
      } as ChangeEvent<HTMLInputElement>);
    });
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0]!.title).toBe("Test Item Two");
  });
  it("filters budgets by status", () => {
    const { result } = renderHook(() =>
      useBudgetsListFilters([mockBudgetRow, mockBudgetRowTwo])
    );
    act(() => {
      result.current.toggleStatus("sent");
    });
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0]!.title).toBe("Test Item Two");
  });
  it("resets all filters", () => {
    const { result } = renderHook(() =>
      useBudgetsListFilters([mockBudgetRow, mockBudgetRowTwo])
    );

    act(() => {
      result.current.searchInputProps.onChange({
        target: { value: "Test Item Two" },
      } as ChangeEvent<HTMLInputElement>);
      result.current.toggleStatus("sent");
    });

    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.hasFilters).toBe(true);

    act(() => {
      result.current.reset();
    });

    expect(result.current.filtered).toHaveLength(2);
    expect(result.current.filtered[0]!.title).toBe("Pressupost test");
    expect(result.current.filtered[1]!.title).toBe("Test Item Two");
    expect(result.current.hasFilters).toBe(false);
    expect(result.current.searchInputProps.value).toBe("");
    expect(result.current.selectedStatuses.size).toBe(0);
  });
  it("sets date range when period is thisMonth", () => {
    const now = new Date();
    const { result } = renderHook(() =>
      useBudgetsListFilters([mockBudgetRow, mockBudgetRowTwo])
    );
    act(() => {
      result.current.setPeriod("thisMonth");
    });
    expect(result.current.dateFrom).toBe(toYMD(startOfMonth(now)));
    expect(result.current.dateTo).toBe(toYMD(now));
  });
  it("returns correct resultsLabel", () => {
    const now = new Date();
    const inMonthDraft = createMockBudgetRow({
      document_date: toYMD(now),
      status: "draft",
    });
    const inMonthSent = createMockBudgetRow({
      id: "2",
      title: "Test Item Two",
      document_date: toYMD(now),
      status: "sent",
    });
    const { result } = renderHook(() =>
      useBudgetsListFilters([inMonthDraft, inMonthSent])
    );

    act(() => {
      result.current.setPeriod("thisMonth");
    });
    expect(result.current.resultsLabel).toBe("2 de 2");

    act(() => {
      result.current.toggleStatus("sent");
    });
    expect(result.current.resultsLabel).toBe("1 de 2");

    act(() => {
      result.current.reset();
    });
    expect(result.current.resultsLabel).toBe("2 de 2");
  });
});
