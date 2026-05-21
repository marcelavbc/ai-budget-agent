import { describe, expect, it } from "vitest";
import type { BudgetLine } from "@/features/budgets/types/budget";
import type { BudgetLineRow, BudgetRow, ClientRow } from "@/features/budgets/types/budgetsDb";
import { budgetLinesToClientItems } from "@/features/budgets/lib/budgetLineToClientItem";
import {
  buildInitialBudgetEditClientDetails,
  buildInitialBudgetEditItems,
} from "@/features/budgets/lib/mapBudgetEditInitialState";

function makeBudgetRow(overrides: Partial<BudgetRow> = {}): BudgetRow {
  return {
    id: "b1",
    client_id: "c1",
    title: "Test budget",
    job_address: "Carrer Major 1",
    quote_number: "2025-01",
    document_date: "2025-01-15",
    estimated_time: "5 dies",
    status: "draft",
    subtotal: 1000,
    tax_rate: 0,
    tax_amount: 0,
    notes: null,
    issue_date: null,
    created_at: null,
    updated_at: null,
    ...overrides,
  };
}

function makeClientRow(overrides: Partial<ClientRow> = {}): ClientRow {
  return {
    id: "c1",
    name: "Joan García",
    phone: null,
    address_street: null,
    address_postal_code: null,
    address_city: null,
    tax_id: null,
    created_at: null,
    ...overrides,
  };
}

function makeBudgetLineRow(overrides: Partial<BudgetLineRow> = {}): BudgetLineRow {
  return {
    id: "l1",
    budget_id: "b1",
    title: "Parets menjador",
    description: "Pintura plàstica",
    quantity: 20,
    unit: "m²",
    unit_price: 12,
    line_total: 240,
    sort_order: 0,
    option_group_id: null,
    option_label: null,
    created_at: null,
    ...overrides,
  };
}

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

describe("buildInitialBudgetEditClientDetails", () => {
  it("maps budget and client fields correctly (nameOrCompany, address fields, quoteNumber, date, estimatedTime)", () => {
    const budget = makeBudgetRow({
      job_address: "Obra Carrer Nou 9",
      quote_number: "Q-42",
      document_date: "2026-03-01",
      estimated_time: "10 dies",
    });
    const client = makeClientRow({
      name: "Acme SL",
      address_street: "Carrer Client 10",
      address_postal_code: "08002",
      address_city: "Barcelona",
    });

    expect(buildInitialBudgetEditClientDetails({ budget, client })).toEqual({
      nameOrCompany: "Acme SL",
      addressStreet: "Carrer Client 10",
      addressPostalCode: "08002",
      addressCity: "Barcelona",
      quoteNumber: "Q-42",
      date: "2026-03-01",
      estimatedTime: "10 dies",
    });
  });

  it("returns empty strings for null/undefined fields (no undefined in output)", () => {
    const budget = makeBudgetRow({
      job_address: null,
      quote_number: null,
      document_date: null,
      estimated_time: null,
    });
    const client = makeClientRow({
      name: null,
      address_street: null,
      address_postal_code: null,
      address_city: null,
    });

    const details = buildInitialBudgetEditClientDetails({ budget, client });

    expect(details).toEqual({
      nameOrCompany: "",
      addressStreet: "",
      addressPostalCode: "",
      addressCity: "",
      quoteNumber: "",
      date: "",
      estimatedTime: "",
    });
    expect(Object.values(details).every((v) => v !== undefined)).toBe(true);
  });
});

describe("buildInitialBudgetEditItems", () => {
  it("maps a line row to BudgetClientItem correctly (id, title, description, quantity, unitLabel, unitPrice, total)", () => {
    const row = makeBudgetLineRow({
      id: "line-a",
      title: "Obra X",
      description: "Detall",
      quantity: 3,
      unit: "unitat",
      unit_price: 100,
      line_total: 300,
    });

    expect(buildInitialBudgetEditItems({ lines: [row] })[0]).toEqual({
      id: "line-a",
      title: "Obra X",
      description: "Detall",
      quantity: 3,
      unitLabel: "unitat",
      unitPrice: 100,
      total: 300,
      optionGroupId: undefined,
      optionLabel: undefined,
    });
  });

  it('falls back to "Partida" when title is null or empty', () => {
    expect(buildInitialBudgetEditItems({ lines: [makeBudgetLineRow({ title: null })] })[0]?.title).toBe(
      "Partida"
    );
    expect(buildInitialBudgetEditItems({ lines: [makeBudgetLineRow({ title: "" })] })[0]?.title).toBe(
      "Partida"
    );
    expect(
      buildInitialBudgetEditItems({ lines: [makeBudgetLineRow({ title: "   " })] })[0]?.title
    ).toBe("Partida");
  });

  it('falls back to "partida" unitLabel for unknown unit values', () => {
    expect(
      buildInitialBudgetEditItems({ lines: [makeBudgetLineRow({ unit: "kg" })] })[0]?.unitLabel
    ).toBe("partida");
    expect(
      buildInitialBudgetEditItems({ lines: [makeBudgetLineRow({ unit: null })] })[0]?.unitLabel
    ).toBe("partida");
  });

  it("preserves optionGroupId and optionLabel when present", () => {
    const row = makeBudgetLineRow({
      option_group_id: "og-1",
      option_label: "Opció A",
    });

    expect(buildInitialBudgetEditItems({ lines: [row] })[0]).toMatchObject({
      optionGroupId: "og-1",
      optionLabel: "Opció A",
    });
  });

  it("calculates total from quantity * unit_price when line_total is null", () => {
    const row = makeBudgetLineRow({
      quantity: 7,
      unit_price: 11.11,
      line_total: null,
    });

    expect(buildInitialBudgetEditItems({ lines: [row] })[0]?.total).toBe(77.77);
  });
});

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
