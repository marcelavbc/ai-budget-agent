import { describe, expect, it } from "vitest";
import type { BudgetLine, BudgetOptionGroup } from "@/features/budgets/types/budget";
import {
  buildOptionGroups,
  getAllLines,
  stripLine,
} from "@/features/budgets/lib/budgetListItems";

function makeLine(overrides: Partial<BudgetLine> = {}): BudgetLine {
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

function makeGroup(id: string, options: BudgetLine[]): BudgetOptionGroup {
  return { id, title: options[0]?.label ?? "Grup", options };
}

describe("getAllLines", () => {
  it("flat list of lines returns the same lines", () => {
    const a = makeLine({ id: "a" });
    const b = makeLine({ id: "b", label: "Sòl" });
    expect(getAllLines([a, b])).toEqual([a, b]);
  });

  it("list with BudgetOptionGroup returns flattened options", () => {
    const optA = makeLine({ id: "opt-a", label: "Opció A" });
    const optB = makeLine({ id: "opt-b", label: "Opció B" });
    const group = makeGroup("g1", [optA, optB]);
    expect(getAllLines([group])).toEqual([optA, optB]);
  });

  it("mixed list (lines + groups) returns all lines flattened", () => {
    const solo = makeLine({ id: "solo" });
    const o1 = makeLine({ id: "o1", optionGroupId: "alt" });
    const o2 = makeLine({ id: "o2", optionGroupId: "alt" });
    const group = makeGroup("alt", [o1, o2]);
    expect(getAllLines([solo, group])).toEqual([solo, o1, o2]);
  });
});

describe("stripLine", () => {
  it("removes a standalone line", () => {
    const line = makeLine({ id: "remove-me" });
    expect(stripLine([line], "remove-me")).toEqual([]);
  });

  it("removes one line from a group of three → group keeps two options", () => {
    const l1 = makeLine({ id: "1", optionGroupId: "g", label: "A" });
    const l2 = makeLine({ id: "2", optionGroupId: "g", label: "B" });
    const l3 = makeLine({ id: "3", optionGroupId: "g", label: "C" });
    const group = makeGroup("g", [l1, l2, l3]);
    const out = stripLine([group], "2");
    expect(out).toHaveLength(1);
    expect(out[0]).toEqual({
      ...group,
      title: "A",
      options: [l1, l3],
    });
  });

  it("removes one line from a pair → group dissolves; surviving line loses optionGroupId and optionLabel", () => {
    const l1 = makeLine({
      id: "1",
      optionGroupId: "g",
      optionLabel: "Primera",
      label: "Un",
    });
    const l2 = makeLine({
      id: "2",
      optionGroupId: "g",
      optionLabel: "Segona",
      label: "Dos",
    });
    const group = makeGroup("g", [l1, l2]);
    expect(stripLine([group], "1")).toEqual([
      {
        ...l2,
        optionGroupId: undefined,
        optionLabel: undefined,
      },
    ]);
  });

  it("removes the only line in a group → returns empty list", () => {
    const only = makeLine({ id: "only", optionGroupId: "g" });
    const group = makeGroup("g", [only]);
    expect(stripLine([group], "only")).toEqual([]);
  });

  it("unknown id → returns the same list unchanged", () => {
    const a = makeLine({ id: "a" });
    const b = makeLine({ id: "b" });
    const items = [a, b];
    expect(stripLine(items, "ghost")).toEqual(items);
  });
});

describe("buildOptionGroups", () => {
  it("lines without optionGroupId stay ungrouped", () => {
    const l1 = makeLine({ id: "x1" });
    const l2 = makeLine({ id: "x2", label: "Altres" });
    expect(buildOptionGroups([l1, l2])).toEqual([l1, l2]);
  });

  it("two consecutive lines with same optionGroupId become a BudgetOptionGroup", () => {
    const l1 = makeLine({
      id: "a",
      optionGroupId: "grp",
      label: "Primera opció",
    });
    const l2 = makeLine({
      id: "b",
      optionGroupId: "grp",
      label: "Segona opció",
    });
    expect(buildOptionGroups([l1, l2])).toEqual([
      {
        id: "grp",
        title: "Primera opció",
        options: [l1, l2],
      },
    ]);
  });

  it("single line with optionGroupId does not become a group (clears option fields)", () => {
    const line = makeLine({
      id: "solo",
      optionGroupId: "g",
      optionLabel: "Única",
    });
    expect(buildOptionGroups([line])).toEqual([
      {
        ...line,
        optionGroupId: undefined,
        optionLabel: undefined,
      },
    ]);
  });

  it("different optionGroupIds yield separate groups", () => {
    const g1a = makeLine({ id: "a", optionGroupId: "g1", label: "G1-A" });
    const g1b = makeLine({ id: "b", optionGroupId: "g1", label: "G1-B" });
    const g2a = makeLine({ id: "c", optionGroupId: "g2", label: "G2-A" });
    const g2b = makeLine({ id: "d", optionGroupId: "g2", label: "G2-B" });
    expect(buildOptionGroups([g1a, g1b, g2a, g2b])).toEqual([
      { id: "g1", title: "G1-A", options: [g1a, g1b] },
      { id: "g2", title: "G2-A", options: [g2a, g2b] },
    ]);
  });

  it("existing BudgetOptionGroup in input is pushed through unchanged", () => {
    const existing = makeGroup("eg", [makeLine({ id: "inside", label: "Dins" })]);
    const after = buildOptionGroups([existing]);
    expect(after).toEqual([existing]);
    expect(after[0]).toBe(existing);
  });
});
