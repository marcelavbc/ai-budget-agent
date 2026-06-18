import { describe, expect, it } from "vitest";
import type {
  BudgetLineRow,
  BudgetRow,
} from "@/features/budgets/types/budgetsDb";
import type { ContactRow } from "@/features/contacts/lib/contacts";
import {
  buildInitialBudgetEditClientDetails,
  buildInitialBudgetEditItems,
} from "@/features/budgets/lib/mapBudgetEditInitialState";

function makeBudgetRow(overrides: Partial<BudgetRow> = {}): BudgetRow {
  return {
    id: "b1",
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
    project_name: null,
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
      projectName: undefined,
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
      projectName: undefined,
      quoteNumber: "",
      date: "",
      estimatedTime: "",
      lang: "ca",
    });
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
        lines: [makeBudgetLineRow({ title: null as unknown as string })],
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
