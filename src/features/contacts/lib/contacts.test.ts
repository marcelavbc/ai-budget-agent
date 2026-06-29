import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mockContacts = [
  {
    id: "contact-empty",
    name: "Empty Contact",
    phone: null,
    email: null,
    tax_id: null,
    fiscal_address_street: null,
    fiscal_address_postal_code: null,
    fiscal_address_city: null,
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "contact-with-budget",
    name: "Budget Contact",
    phone: null,
    email: null,
    tax_id: null,
    fiscal_address_street: null,
    fiscal_address_postal_code: null,
    fiscal_address_city: null,
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
  },
  {
    id: "contact-with-invoice",
    name: "Invoice Contact",
    phone: null,
    email: null,
    tax_id: null,
    fiscal_address_street: null,
    fiscal_address_postal_code: null,
    fiscal_address_city: null,
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
  },
];

const mockBudgetRows = [{ contact_id: "contact-with-budget" }];
const mockInvoiceRows = [{ contact_id: "contact-with-invoice" }];

vi.mock("@/core/lib/supabaseClient", () => ({
  getSupabaseClient: () => ({
    from: (table: string) => {
      if (table === "contacts") {
        return {
          select: () => ({
            order: () =>
              Promise.resolve({ data: mockContacts, error: null }),
          }),
        };
      }
      if (table === "budgets") {
        return {
          select: () =>
            Promise.resolve({ data: mockBudgetRows, error: null }),
        };
      }
      if (table === "invoices") {
        return {
          select: () =>
            Promise.resolve({ data: mockInvoiceRows, error: null }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  }),
}));

import {
  contactHasReferences,
  contactHasExtraData,
  getContactListWithFlags,
  suggestMergeSurvivor,
  suggestMergeSurvivorAmong,
  type ContactRow,
} from "./contacts";

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

describe("getContactListWithFlags", () => {
  it("marks contacts with no budgets or invoices as hasNoBudgetsOrInvoices: true", async () => {
    const result = await getContactListWithFlags();
    const empty = result.find((c) => c.id === "contact-empty");
    expect(empty?.hasNoBudgetsOrInvoices).toBe(true);
  });

  it("marks contacts with at least one budget as hasNoBudgetsOrInvoices: false", async () => {
    const result = await getContactListWithFlags();
    const withBudget = result.find((c) => c.id === "contact-with-budget");
    expect(withBudget?.hasNoBudgetsOrInvoices).toBe(false);
  });

  it("marks contacts with at least one invoice as hasNoBudgetsOrInvoices: false", async () => {
    const result = await getContactListWithFlags();
    const withInvoice = result.find((c) => c.id === "contact-with-invoice");
    expect(withInvoice?.hasNoBudgetsOrInvoices).toBe(false);
  });
});

describe("contactHasReferences", () => {
  it("returns false when both counts are zero", () => {
    expect(contactHasReferences({ budgetCount: 0, invoiceCount: 0 })).toBe(false);
  });
  it("returns true when there is at least one budget", () => {
    expect(contactHasReferences({ budgetCount: 1, invoiceCount: 0 })).toBe(true);
  });
  it("returns true when there is at least one invoice", () => {
    expect(contactHasReferences({ budgetCount: 0, invoiceCount: 1 })).toBe(true);
  });
  it("returns true when both are present", () => {
    expect(contactHasReferences({ budgetCount: 2, invoiceCount: 3 })).toBe(true);
  });
});

describe("contactHasExtraData", () => {
  it("returns false when there is no phone, email, tax_id, or address", () => {
    expect(
      contactHasExtraData({ phone: null, email: null, tax_id: null, addressCount: 0 })
    ).toBe(false);
  });
  it("returns false when fields are empty strings, not just null", () => {
    expect(
      contactHasExtraData({ phone: "", email: "  ", tax_id: "", addressCount: 0 })
    ).toBe(false);
  });
  it("returns true when phone is present", () => {
    expect(
      contactHasExtraData({ phone: "600111222", email: null, tax_id: null, addressCount: 0 })
    ).toBe(true);
  });
  it("returns true when tax_id is present", () => {
    expect(
      contactHasExtraData({ phone: null, email: null, tax_id: "12345678A", addressCount: 0 })
    ).toBe(true);
  });
  it("returns true when there is at least one job address", () => {
    expect(
      contactHasExtraData({ phone: null, email: null, tax_id: null, addressCount: 1 })
    ).toBe(true);
  });
});

describe("suggestMergeSurvivor", () => {
  it("returns a when a has more filled fields than b", () => {
    const a = makeContactRow({
      id: "a",
      phone: "600111222",
      email: "a@example.com",
    });
    const b = makeContactRow({ id: "b" });

    expect(suggestMergeSurvivor(a, b)).toBe(a);
  });

  it("returns b when b has more filled fields than a", () => {
    const a = makeContactRow({ id: "a" });
    const b = makeContactRow({
      id: "b",
      phone: "600333444",
      tax_id: "12345678A",
    });

    expect(suggestMergeSurvivor(a, b)).toBe(b);
  });

  it("returns a when both have the same filled fields and a was created earlier", () => {
    const a = makeContactRow({
      id: "a",
      phone: "600111222",
      created_at: "2024-01-01T00:00:00.000Z",
    });
    const b = makeContactRow({
      id: "b",
      phone: "600333444",
      created_at: "2025-01-01T00:00:00.000Z",
    });

    expect(suggestMergeSurvivor(a, b)).toBe(a);
  });

  it("returns b when both have the same filled fields and b was created earlier", () => {
    const a = makeContactRow({
      id: "a",
      phone: "600111222",
      created_at: "2025-06-01T00:00:00.000Z",
    });
    const b = makeContactRow({
      id: "b",
      phone: "600333444",
      created_at: "2024-06-01T00:00:00.000Z",
    });

    expect(suggestMergeSurvivor(a, b)).toBe(b);
  });

  it("returns the contact with tax_id over a name-only contact", () => {
    const nameOnly = makeContactRow({ id: "name-only", name: "Roger" });
    const withTaxId = makeContactRow({
      id: "with-tax-id",
      name: "Roger SL",
      tax_id: "B12345678",
    });

    expect(suggestMergeSurvivor(nameOnly, withTaxId)).toBe(withTaxId);
  });
});

describe("suggestMergeSurvivorAmong", () => {
  it("returns the contact with the most filled fields among three", () => {
    const sparse = makeContactRow({ id: "sparse" });
    const medium = makeContactRow({ id: "medium", phone: "600111222" });
    const rich = makeContactRow({
      id: "rich",
      phone: "600333444",
      email: "rich@example.com",
      tax_id: "B12345678",
    });

    expect(suggestMergeSurvivorAmong([sparse, medium, rich])).toBe(rich);
  });
});
