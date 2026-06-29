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
} from "./contacts";

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
