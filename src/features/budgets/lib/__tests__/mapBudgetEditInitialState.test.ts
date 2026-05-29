import { describe, expect, it } from "vitest";
import type { BudgetLine } from "@/features/budgets/types/budget";
import type {
  BudgetLineRow,
  BudgetRow,
  ContactRow,
} from "@/features/budgets/types/budgetsDb";
import { budgetLinesToClientItems } from "@/features/budgets/lib/budgetLineToClientItem";
import {
  buildInitialBudgetEditClientDetails,
  buildInitialBudgetEditItems,
} from "@/features/budgets/lib/mapBudgetEditInitialState";

function makeBudgetRow(overrides: Partial<BudgetRow> = {}): BudgetRow {
  return {
    id: "b1",
    client_id: "c1",
    contact_id: "c1",
    title: "Test budget",
    job_address: "Carrer Major 1",
    job_address_street: null,
    job_address_postal_code: null,
    job_address_city: null,
    quote_number: "2025-01",
    document_date: "2025-01-15",
    estimated_time: "5 dies",
    status: "draft",
    subtotal: 1000,
    tax_rate: 0,
    tax_amount: 0,
    notes: null,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
    lang: "ca",
    ...overrides,
  };
}

function makeContactRow(overrides: Partial<ContactRow> = {}): ContactRow {
  return {
    id: "c1",
    name: "Joan García",
    phone: null,
    email: null,
    tax_id: null,
    fiscal_address_street: null,
    fiscal_address_postal_code: null,
    fiscal_address_city: null,
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeBudgetLineRow(
  overrides: Partial<BudgetLineRow> = {}
): BudgetLineRow {
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
    created_at: "2025-01-01T00:00:00.000Z",
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
      job_address_street: "Carrer Client 10",
      job_address_postal_code: "08002",
      job_address_city: "Barcelona",
      quote_number: "Q-42",
      document_date: "2026-03-01",
      estimated_time: "10 dies",
    });
    const contact = makeContactRow({
      name: "Acme SL",
    });

    expect(buildInitialBudgetEditClientDetails({ budget, contact })).toEqual({
      nameOrCompany: "Acme SL",
      jobAddressStreet: "Carrer Client 10",
      jobAddressPostalCode: "08002",
      jobAddressCity: "Barcelona",
      quoteNumber: "Q-42",
      date: "2026-03-01",
      estimatedTime: "10 dies",
      lang: "ca",
    });
  });

  it("returns empty strings for null/undefined fields (no undefined in output)", () => {
    const budget = makeBudgetRow({
      job_address: null,
      job_address_street: null,
      job_address_postal_code: null,
      job_address_city: null,
      quote_number: null,
      document_date: null,
      estimated_time: null,
    });
    const contact = {
      ...makeContactRow(),
      name: null,
    } as unknown as ContactRow;

    const details = buildInitialBudgetEditClientDetails({ budget, contact });

    expect(details).toEqual({
      nameOrCompany: "",
      jobAddressStreet: "",
      jobAddressPostalCode: "",
      jobAddressCity: "",
      quoteNumber: "",
      date: "",
      estimatedTime: "",
      lang: "ca",
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
    expect(
      buildInitialBudgetEditItems({
        lines: [
          makeBudgetLineRow({ title: null as unknown as string }),
        ],
      })[0]?.title
    ).toBe("Partida");
    expect(
      buildInitialBudgetEditItems({
        lines: [makeBudgetLineRow({ title: "" })],
      })[0]?.title
    ).toBe("Partida");
    expect(
      buildInitialBudgetEditItems({
        lines: [makeBudgetLineRow({ title: "   " })],
      })[0]?.title
    ).toBe("Partida");
  });

  it('falls back to "partida" unitLabel for unknown unit values', () => {
    expect(
      buildInitialBudgetEditItems({
        lines: [makeBudgetLineRow({ unit: "kg" })],
      })[0]?.unitLabel
    ).toBe("partida");
    expect(
      buildInitialBudgetEditItems({
        lines: [makeBudgetLineRow({ unit: null })],
      })[0]?.unitLabel
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
    const row = {
      ...makeBudgetLineRow({
        quantity: 7,
        unit_price: 11.11,
      }),
      line_total: null,
    } as unknown as BudgetLineRow;

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
