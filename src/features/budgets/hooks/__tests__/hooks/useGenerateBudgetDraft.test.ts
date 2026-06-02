// @vitest-environment jsdom

import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGenerateBudgetDraft } from "@/features/budgets/hooks/useGenerateBudgetDraft";
describe("useGenerateBudgetDraft", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });
  it("returns lines when API responds correctly", async () => {
    // 1. Mock de fetch
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          lines: [
            {
              id: "1",
              type: "custom",
              label: "Pintar saló",
              quantity: 1,
              unitLabel: "partida",
              unitPrice: 500,
              subtotal: 500,
              pricingMode: "input",
            },
          ],
        }),
      })
    );

    // 2. Renderizar el hook
    const { result } = renderHook(() => useGenerateBudgetDraft());

    // 3. Llamar a submit
    const lines = await act(async () => result.current.submit("pintar saló"));

    // 4. Verificar resultado
    expect(lines).not.toBeNull();
    if (!lines) throw new Error("expected lines from submit");
    expect(lines).toHaveLength(1);
    expect(lines[0]!.label).toBe("Pintar saló");
  });
  it("returns null and sets error when API fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "API error" }),
      })
    );
    const { result } = renderHook(() => useGenerateBudgetDraft());
    const lines = await act(async () => result.current.submit("pintar saló"));
    expect(lines).toBeNull();
    expect(result.current.formError).toBe("API error");
  });
  it("returns null and sets error when fetch throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error"))
    );

    const { result } = renderHook(() => useGenerateBudgetDraft());

    const lines = await act(async () => result.current.submit("pintar saló"));

    expect(lines).toBeNull();
    expect(result.current.formError).toBe(
      "No s'ha pogut connectar. Comprova la connexió i torna-ho a provar."
    );
  });
});
