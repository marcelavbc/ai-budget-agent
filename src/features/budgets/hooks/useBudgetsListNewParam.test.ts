// @vitest-environment jsdom

import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useBudgetsListNewParam } from "./useBudgetsListNewParam";
import { BudgetListRow } from "../types/budgetsDb";
import { fetchBudgetById } from "@/features/budgets/lib/budgetsClient";

const mockGetParam = vi.fn();

const mockBudgets: BudgetListRow[] = [
  {
    id: "1",
    title: "Budget 1",
    job_address: "123 Main St",
    status: "draft",
    document_date: "2021-01-01",
    quote_number: "1234567890",
    created_at: "2021-01-01",
    lang: "en",
  },
  {
    id: "2",
    title: "Budget 2",
    job_address: "456 Secondary St",
    status: "draft",
    document_date: "2021-01-01",
    quote_number: "1234567890",
    created_at: "2021-01-01",
    lang: "en",
  },
];
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => ({ get: mockGetParam }),
}));

vi.mock("@/features/budgets/lib/budgetsClient", () => ({
  fetchBudgetById: vi.fn(),
}));

describe("useBudgetsListNewParam", () => {
  it("returns the budgets original list when no new param is present", () => {
    mockGetParam.mockReturnValue(null);

    const { result } = renderHook(() => useBudgetsListNewParam(mockBudgets));

    expect(result.current).toEqual(mockBudgets);
  });

  it("prepends the new budget when fetch succeeds", async () => {
    const newBudget: BudgetListRow = {
      id: "999",
      title: "New Budget",
      job_address: null,
      status: "draft",
      document_date: "2026-06-04",
      quote_number: "999",
      created_at: "2026-06-04",
      lang: "ca",
    };

    // fetchBudgetById devuelve el presupuesto nuevo
    vi.mocked(fetchBudgetById).mockResolvedValue(newBudget);
    mockGetParam.mockReturnValue("999");

    const { result } = renderHook(() => useBudgetsListNewParam(mockBudgets));

    // Esperamos a que el fetch termine y el estado se actualice
    await waitFor(() => {
      expect(result.current[0]).toEqual(newBudget);
    });

    // La lista completa tiene el nuevo presupuesto al principio
    expect(result.current).toEqual([newBudget, ...mockBudgets]);
  });
  it("does not fetch the new budget when it is already in the list", async () => {
    mockGetParam.mockReturnValue("1");

    const { result } = renderHook(() => useBudgetsListNewParam(mockBudgets));

    expect(result.current).toEqual(mockBudgets);
  });
  it("does not prepend the new budget when fetch fails", async () => {
    vi.mocked(fetchBudgetById).mockRejectedValue(new Error("Fetch failed"));
    mockGetParam.mockReturnValue("999");

    const { result } = renderHook(() => useBudgetsListNewParam(mockBudgets));

    expect(result.current).toEqual(mockBudgets);
  });
});
