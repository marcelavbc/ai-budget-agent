import { describe, expect, it } from "vitest";
import type { BudgetLine } from "@/features/budgets/types/budget";
import { budgetLinesToClientItems } from "@/features/budgets/lib/budgetLineToClientItem";

function makeBudgetLine(overrides: Partial<BudgetLine> = {}): BudgetLine {
  return {
    id: "l1",
    type: "walls_and_ceilings",
    label: "Parets",
    quantity: 10,
    unitLabel: "m²",
    unitPrice: 12,
    subtotal: 120,
    pricingMode: "input",
    ...overrides,
  };
}

describe("budgetLinesToClientItems", () => {
  it("maps BudgetLine[] to BudgetClientItem[] correctly", () => {
    const lines: BudgetLine[] = [
      makeBudgetLine({ id: "a", label: "One" }),
      makeBudgetLine({
        id: "b",
        type: "doors",
        label: "Two",
        quantity: 2,
        unitLabel: "unitat",
        unitPrice: 50,
        subtotal: 100,
      }),
    ];

    const items = budgetLinesToClientItems(lines);

    expect(items).toHaveLength(2);
    expect(items[0]?.id).toBe("a");
    expect(items[1]?.id).toBe("b");
  });

  it("each type gets a non-empty default description", () => {
    const types = [
      "walls_and_ceilings",
      "repair",
      "doors",
      "windows",
      "enamel_varnish",
      "exterior",
      "custom",
    ] as const;

    for (const type of types) {
      const [item] = budgetLinesToClientItems([makeBudgetLine({ type })]);
      expect(item?.description?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("maps id, title, quantity, unitLabel, unitPrice, total correctly", () => {
    const [item] = budgetLinesToClientItems([
      makeBudgetLine({
        id: "lid",
        label: "Etiqueta",
        quantity: 4,
        unitLabel: "partida",
        unitPrice: 25.5,
        subtotal: 102,
      }),
    ]);

    expect(item).toMatchObject({
      id: "lid",
      title: "Etiqueta",
      quantity: 4,
      unitLabel: "partida",
      unitPrice: 25.5,
      total: 102,
    });
  });
});
