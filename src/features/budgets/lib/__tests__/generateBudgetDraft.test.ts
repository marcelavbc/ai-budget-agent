import { describe, expect, it } from "vitest";
import type { BudgetLine, BudgetOptionGroup } from "@/features/budgets/types/budget";
import { generateBudgetDraft } from "@/features/budgets/lib/generateBudgetDraft";

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

describe("generateBudgetDraft", () => {
  it("walls_and_ceilings: description includes Jotun Jotaprof Supermate", () => {
    const [item] = generateBudgetDraft([
      makeLine({
        type: "walls_and_ceilings",
        label: "Parets i sostres",
      }),
    ]);
    expect(item?.description).toContain("Jotun Jotaprof Supermate");
  });

  it("exterior: description includes Isaval Fixenol and Isaval Bixolan", () => {
    const [item] = generateBudgetDraft([
      makeLine({
        type: "exterior",
        label: "Façana",
      }),
    ]);
    expect(item?.description).toContain("Isaval Fixenol");
    expect(item?.description).toContain("Isaval Bixolan");
  });

  it("openings (doors/windows): description includes Titanlux Ecològic", () => {
    const [doors] = generateBudgetDraft([
      makeLine({
        type: "doors",
        label: "Portes interiors",
      }),
    ]);
    expect(doors?.description).toContain("Titanlux Ecològic");

    const [windows] = generateBudgetDraft([
      makeLine({
        id: "w1",
        type: "windows",
        label: "Finestres",
      }),
    ]);
    expect(windows?.description).toContain("Titanlux Ecològic");
  });

  it("enamel (enamel_varnish): description includes Isaval and Jotun", () => {
    const [item] = generateBudgetDraft([
      makeLine({
        type: "enamel_varnish",
        label: "Esmalt metall",
      }),
    ]);
    expect(item?.description).toContain("Isaval");
    expect(item?.description).toContain("Jotun");
  });

  it("when label mentions a color, description uses it instead of deferring choice", () => {
    const [item] = generateBudgetDraft([
      makeLine({
        type: "walls_and_ceilings",
        label: "Paredes en blanc",
      }),
    ]);
    expect(item?.description.toLowerCase()).toContain("blanc");
    expect(item?.description).not.toContain("a escollir");
  });

  it("custom: description is empty", () => {
    const [item] = generateBudgetDraft([
      makeLine({
        type: "custom",
        label: "Partida personalitzada",
      }),
    ]);
    expect(item?.description).toBe("");
  });

  it("mixed list: standalone line first, then options with matching optionGroupId", () => {
    const simple = makeLine({
      id: "line-simple",
      type: "walls_and_ceilings",
      label: "Parets menjador",
    });
    const group: BudgetOptionGroup = {
      id: "passama-grup",
      title: "Passamà",
      options: [
        makeLine({
          id: "opt-a",
          label: "Passamà: Opció A",
          unitPrice: 200,
          subtotal: 200,
          optionGroupId: "passama-grup",
          optionLabel: "Opció 1",
        }),
        makeLine({
          id: "opt-b",
          label: "Passamà: Opció B",
          unitPrice: 150,
          subtotal: 150,
          optionGroupId: "passama-grup",
          optionLabel: "Opció 2",
        }),
      ],
    };

    const items = generateBudgetDraft([simple, group]);

    expect(items).toHaveLength(3);
    expect(items[0]?.id).toBe("line-simple");
    expect(items[0]?.optionGroupId).toBeUndefined();

    expect(items[1]?.id).toBe("opt-a");
    expect(items[1]?.optionGroupId).toBe("passama-grup");
    expect(items[1]?.optionLabel).toBe("Opció 1");

    expect(items[2]?.id).toBe("opt-b");
    expect(items[2]?.optionGroupId).toBe("passama-grup");
    expect(items[2]?.optionLabel).toBe("Opció 2");
  });
});
