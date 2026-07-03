import { describe, expect, it } from "vitest";
import type { BudgetRow } from "@/features/budgets/types/budgetsDb";
import type { ContactRow } from "@/features/contacts/lib/contacts";
import { resolveBudgetClientIdentity } from "@/features/budgets/lib/resolveBudgetClientIdentity";

function makeBudget(
  overrides: Partial<
    Pick<
      BudgetRow,
      | "status"
      | "client_name"
      | "client_tax_id"
      | "client_address_street"
      | "client_address_postal_code"
      | "client_address_city"
    >
  > = {}
) {
  return {
    status: "draft",
    client_name: null,
    client_tax_id: null,
    client_address_street: null,
    client_address_postal_code: null,
    client_address_city: null,
    ...overrides,
  };
}

function makeContact(overrides: Partial<ContactRow> = {}): ContactRow {
  return {
    id: "c1",
    name: "Contacte viu",
    phone: null,
    email: null,
    tax_id: "B12345678",
    fiscal_address_street: "Carrer Contacte 1",
    fiscal_address_postal_code: "08001",
    fiscal_address_city: "Barcelona",
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const contactIdentity = {
  name: "Contacte viu",
  tax_id: null,
  fiscal_address_street: null,
  fiscal_address_postal_code: null,
  fiscal_address_city: null,
};

describe("resolveBudgetClientIdentity", () => {
  it("uses budget client fields and keeps unlocked when status is not invoiced", () => {
    const contact = makeContact({
      name: "Contacte no hauria de sobreescriure",
      tax_id: "B99999999",
      fiscal_address_street: "Altra adreça",
      fiscal_address_postal_code: "08099",
      fiscal_address_city: "Girona",
    });

    for (const status of ["draft", "sent", "approved"] as const) {
      const budget = makeBudget({
        status,
        client_name: "Client pressupost",
        client_tax_id: "B11111111",
        client_address_street: "Via Pressupost 2",
        client_address_postal_code: "25001",
        client_address_city: "Lleida",
      });

      expect(resolveBudgetClientIdentity(budget, contact)).toEqual({
        name: "Client pressupost",
        tax_id: "B11111111",
        fiscal_address_street: "Via Pressupost 2",
        fiscal_address_postal_code: "25001",
        fiscal_address_city: "Lleida",
        locked: false,
      });
    }
  });

  it("falls back to contact name when budget client_name is empty", () => {
    const contact = makeContact();

    const budget = makeBudget({
      status: "draft",
      client_name: "   ",
      client_tax_id: null,
      client_address_street: null,
      client_address_postal_code: null,
      client_address_city: null,
    });

    expect(resolveBudgetClientIdentity(budget, contact)).toEqual({
      ...contactIdentity,
      locked: false,
    });
  });

  it("locks only when status is invoiced", () => {
    const budget = makeBudget({
      status: "invoiced",
      client_name: "Facturat SL",
      client_tax_id: "B11111111",
      client_address_street: "Via Factura 2",
      client_address_postal_code: "25001",
      client_address_city: "Lleida",
    });
    const contact = makeContact({ name: "No hauria de sortir" });

    expect(resolveBudgetClientIdentity(budget, contact)).toEqual({
      name: "Facturat SL",
      tax_id: "B11111111",
      fiscal_address_street: "Via Factura 2",
      fiscal_address_postal_code: "25001",
      fiscal_address_city: "Lleida",
      locked: true,
    });
  });
});
