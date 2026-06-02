// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { useQuoteNumber } from "./useQuoteNumber";
import { renderHook } from "@testing-library/react";
import { BudgetClientDetails } from "../types/budget";
import { act, useState } from "react";

describe("useQuoteNumber", () => {
  it("should build auto quote number", async () => {
    const { result } = renderHook(() => {
      const [clientDetails, setClientDetails] = useState<BudgetClientDetails>({
        nameOrCompany: "",
        quoteNumber: "",
        date: "2026-01-01",
        estimatedTime: "",
        lang: "ca",
      });
      return {
        ...useQuoteNumber({ setClientDetails }),
        clientDetails,
      };
    });
    await act(async () => {
      result.current.setClientWithAutoQuote((prev) => ({
        ...prev,
        nameOrCompany: "Maria Vila",
      }));
    });
    expect(result.current.clientDetails.quoteNumber).toContain("MV");
  });
  it("should not change the quote number if it is manually edited", async () => {
    const { result } = renderHook(() => {
      const [clientDetails, setClientDetails] = useState<BudgetClientDetails>({
        nameOrCompany: "",
        quoteNumber: "",
        date: "2026-01-01",
        estimatedTime: "",
        lang: "ca",
      });
      return {
        ...useQuoteNumber({ setClientDetails }),
        clientDetails,
      };
    });

    await act(async () => {
      result.current.setClientWithAutoQuote((prev) => ({
        ...prev,
        nameOrCompany: "Maria Vila",
      }));
    });
    const autoQuote = result.current.clientDetails.quoteNumber;

    await act(async () => {
      result.current.onQuoteNumberChange("PRE-0001");
    });

    await act(async () => {
      result.current.setClientWithAutoQuote((prev) => ({
        ...prev,
        nameOrCompany: "Jose Perez",
      }));
    });

    expect(result.current.clientDetails.quoteNumber).toBe("PRE-0001");
    expect(result.current.clientDetails.quoteNumber).not.toBe(autoQuote);
  });
  it("should regenerate the quote number when resetAutomation is called", async () => {
    const { result } = renderHook(() => {
      const [clientDetails, setClientDetails] = useState<BudgetClientDetails>({
        nameOrCompany: "",
        quoteNumber: "",
        date: "2026-01-01",
        estimatedTime: "",
        lang: "ca",
      });
      return {
        ...useQuoteNumber({ setClientDetails }),
        clientDetails,
      };
    });
    await act(async () => {
      result.current.setClientWithAutoQuote((prev) => ({
        ...prev,
        nameOrCompany: "Maria Vila",
      }));
    });
    const autoQuote = result.current.clientDetails.quoteNumber;
    await act(async () => {
      result.current.resetAutomation();
    });
    await act(async () => {
      result.current.setClientWithAutoQuote((prev) => ({
        ...prev,
        nameOrCompany: "Jose Perez",
      }));
    });

    expect(result.current.clientDetails.quoteNumber).toContain("JP");
    expect(result.current.clientDetails.quoteNumber).not.toBe(autoQuote);
  });
});
