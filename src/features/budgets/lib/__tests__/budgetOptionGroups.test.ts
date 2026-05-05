import { describe, expect, it } from "vitest";
import type { BudgetLine, BudgetOptionGroup } from "@/features/budgets/types/budget";
import { generateBudgetDraft } from "@/features/budgets/lib/generateBudgetDraft";
import { hydrateBudgetLines } from "@/features/budgets/lib/hydrateBudgetLines";
import { toBudgetLineRows } from "@/features/budgets/lib/helpers";

function makeLine(overrides: Partial<BudgetLine> = {}): BudgetLine {
  return {
    id: "l1",
    type: "enamel_varnish",
    label: "Passamà de fusta",
    quantity: 1,
    unitLabel: "partida",
    unitPrice: 100,
    subtotal: 100,
    pricingMode: "input",
    ...overrides,
  };
}

describe("budget option groups", () => {
  it("generateBudgetDraft flattens BudgetOptionGroup into client items", () => {
    const group: BudgetOptionGroup = {
      id: "passama-fusta",
      title: "Passamà de fusta",
      options: [
        makeLine({
          id: "o1",
          label: "Passamà de fusta: Decapat + Lasur",
          unitPrice: 570,
          subtotal: 570,
          optionGroupId: "passama-fusta",
          optionLabel: "Opció 1",
        }),
        makeLine({
          id: "o2",
          label: "Passamà de fusta: Polit + esmalt",
          unitPrice: 320,
          subtotal: 320,
          optionGroupId: "passama-fusta",
          optionLabel: "Opció 2",
        }),
      ],
    };

    const items = generateBudgetDraft([group]);
    expect(items).toHaveLength(2);
    expect(items[0]?.optionGroupId).toBe("passama-fusta");
    expect(items[0]?.optionLabel).toBe("Opció 1");
    expect(items[1]?.optionLabel).toBe("Opció 2");
  });

  it("hydrateBudgetLines preserves optionGroupId and optionLabel when present", () => {
    const [line] = hydrateBudgetLines([
      {
        type: "enamel_varnish",
        label: "Passamà: decapat + lasur",
        quantity: 1,
        unitLabel: "partida",
        optionGroupId: "passama-fusta",
        optionLabel: "Opció 1",
      },
    ]);

    expect(line?.optionGroupId).toBe("passama-fusta");
    expect(line?.optionLabel).toBe("Opció 1");
  });

  it("toBudgetLineRows writes option fields when provided", () => {
    const [row] = toBudgetLineRows("b1", [
      {
        id: "o1",
        title: "Passamà: decapat + lasur",
        description: "…",
        total: 570,
        optionGroupId: "passama-fusta",
        optionLabel: "Opció 1",
      },
    ]);

    expect(row?.option_group_id).toBe("passama-fusta");
    expect(row?.option_label).toBe("Opció 1");
  });
});

