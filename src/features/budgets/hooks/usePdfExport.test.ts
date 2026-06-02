// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { usePdfExport } from "./usePdfExport";

const generateBudgetPdf = vi.fn();

vi.mock("@/features/budgets/lib/generateBudgetPdf", () => ({
  generateBudgetPdf: (...args: unknown[]) => generateBudgetPdf(...args),
}));

describe("usePdfExport", () => {
  beforeEach(() => {
    generateBudgetPdf.mockReset();
  });

  it("sets generating to true while exporting", async () => {
    let resolvePromise!: () => void;
    const promise = new Promise<Blob>((resolve) => {
      resolvePromise = () => resolve(new Blob());
    });
    generateBudgetPdf.mockReturnValue(promise);
    const { result } = renderHook(() => usePdfExport());
    act(() => {
      result.current.exportPdf({
        client: {
          nameOrCompany: "Maria Vila",
          quoteNumber: "MV-20260101",
          date: "2026-01-01",
          estimatedTime: "",
          lang: "ca",
        },
        items: [],
      });
    });
    await waitFor(() => {
      expect(result.current.generating).toBe(true);
    });
    resolvePromise();
    await waitFor(() => {
      expect(result.current.generating).toBe(false);
    });
  });
  it("sets pdfError when generateBudgetPdf fails", async () => {
    generateBudgetPdf.mockRejectedValue(new Error("PDF error"));
    const { result } = renderHook(() => usePdfExport());

    await act(async () => {
      await result.current.exportPdf({
        client: {
          nameOrCompany: "Maria Vila",
          quoteNumber: "MV-20260101",
          date: "2026-01-01",
          estimatedTime: "",
          lang: "ca",
        },
        items: [],
      });
    });

    await waitFor(() => {
      expect(result.current.pdfError).toBe("PDF error");
    });
    expect(result.current.generating).toBe(false);
  });
  it("does not call generateBudgetPdf if already generating", async () => {
    generateBudgetPdf.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => usePdfExport());

    const client = {
      nameOrCompany: "Maria Vila",
      quoteNumber: "MV-20260101",
      date: "2026-01-01",
      estimatedTime: "",
      lang: "ca" as const,
    };

    // Primera llamada — no esperamos que resuelva
    act(() => {
      result.current.exportPdf({ client, items: [] });
    });

    // Segunda llamada inmediata
    act(() => {
      result.current.exportPdf({ client, items: [] });
    });

    await waitFor(() => {
      expect(generateBudgetPdf).toHaveBeenCalledTimes(1);
    });
  });
});
