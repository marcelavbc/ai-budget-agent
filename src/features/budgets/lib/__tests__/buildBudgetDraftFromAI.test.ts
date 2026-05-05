import { describe, expect, it, vi } from "vitest";
import { buildBudgetDraftFromAI } from "../buildBudgetDraftFromAI";

vi.mock("../parseBudgetLinesWithAI", () => ({
  parseBudgetLinesWithAI: vi.fn(),
}));

vi.mock("../hydrateBudgetLines", () => ({
  hydrateBudgetLines: vi.fn(),
}));

import { parseBudgetLinesWithAI } from "../parseBudgetLinesWithAI";
import { hydrateBudgetLines } from "../hydrateBudgetLines";

describe("buildBudgetDraftFromAI", () => {
  it("builds a draft by parsing and hydrating AI lines", async () => {
    vi.mocked(parseBudgetLinesWithAI).mockResolvedValue({
      lines: [
        {
          type: "doors",
          label: "Pintura de portes",
          quantity: 5,
          unitLabel: "unitat",
        },
      ],
    });

    vi.mocked(hydrateBudgetLines).mockReturnValue([
      {
        id: "doors-0",
        type: "doors",
        label: "Pintura de portes",
        quantity: 5,
        unitLabel: "unitat",
        unitPrice: 30,
        subtotal: 150,
        pricingMode: "input",
      },
    ]);

    const result = await buildBudgetDraftFromAI("Pintar 5 portes");

    expect(parseBudgetLinesWithAI).toHaveBeenCalledWith("Pintar 5 portes");
    expect(hydrateBudgetLines).toHaveBeenCalledWith([
      {
        type: "doors",
        label: "Pintura de portes",
        quantity: 5,
        unitLabel: "unitat",
      },
    ]);

    expect(result).toEqual([
      {
        id: "doors-0",
        type: "doors",
        label: "Pintura de portes",
        quantity: 5,
        unitLabel: "unitat",
        unitPrice: 30,
        subtotal: 150,
        pricingMode: "input",
      },
    ]);
  });
});
