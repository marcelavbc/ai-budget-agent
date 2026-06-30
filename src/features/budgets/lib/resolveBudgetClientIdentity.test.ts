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
  tax_id: "B12345678",
  fiscal_address_street: "Carrer Contacte 1",
  fiscal_address_postal_code: "08001",
  fiscal_address_city: "Barcelona",
  locked: false,
};

describe("resolveBudgetClientIdentity", () => {
  it("uses budget snapshot for draft/sent with client_name, locked: false", () => {
    const contact = makeContact({ name: "Contacte viu" });

    const draftBudget = makeBudget({
      status: "draft",
      client_name: "Snapshot antic",
      client_tax_id: "X999",
      client_address_street: "Carrer Snapshot 1",
      client_address_postal_code: "43001",
      client_address_city: "Tarragona",
    });
    expect(resolveBudgetClientIdentity(draftBudget, contact)).toEqual({
      name: "Snapshot antic",
      tax_id: "X999",
      fiscal_address_street: "Carrer Snapshot 1",
      fiscal_address_postal_code: "43001",
      fiscal_address_city: "Tarragona",
      locked: false,
    });

    const sentBudget = makeBudget({
      status: "sent",
      client_name: "Snapshot antic",
      client_tax_id: "X999",
      client_address_street: "Carrer Snapshot 1",
      client_address_postal_code: "43001",
      client_address_city: "Tarragona",
    });
    expect(resolveBudgetClientIdentity(sentBudget, contact)).toEqual({
      name: "Snapshot antic",
      tax_id: "X999",
      fiscal_address_street: "Carrer Snapshot 1",
      fiscal_address_postal_code: "43001",
      fiscal_address_city: "Tarragona",
      locked: false,
    });
  });

  it("falls back to contact for draft/sent/approved without client_name snapshot, locked: false", () => {
    const contact = makeContact();

    for (const status of ["draft", "sent", "approved"] as const) {
      const budget = makeBudget({ status, client_name: null });
      expect(resolveBudgetClientIdentity(budget, contact)).toEqual(
        contactIdentity
      );
    }

    const emptyNameBudget = makeBudget({ status: "draft", client_name: "" });
    expect(resolveBudgetClientIdentity(emptyNameBudget, contact)).toEqual(
      contactIdentity
    );

    const whitespaceNameBudget = makeBudget({
      status: "approved",
      client_name: "   ",
    });
    expect(resolveBudgetClientIdentity(whitespaceNameBudget, contact)).toEqual(
      contactIdentity
    );
  });

  it("uses budget snapshot for approved with client_name, locked: false", () => {
    const budget = makeBudget({
      status: "approved",
      client_name: "Client congelat SL",
      client_tax_id: "B00000000",
      client_address_street: "Carrer Snapshot 9",
      client_address_postal_code: "43001",
      client_address_city: "Tarragona",
    });
    const contact = makeContact({
      name: "Contacte editat després",
      tax_id: "B99999999",
      fiscal_address_street: "Altra adreça",
      fiscal_address_postal_code: "08099",
      fiscal_address_city: "Girona",
    });

    expect(resolveBudgetClientIdentity(budget, contact)).toEqual({
      name: "Client congelat SL",
      tax_id: "B00000000",
      fiscal_address_street: "Carrer Snapshot 9",
      fiscal_address_postal_code: "43001",
      fiscal_address_city: "Tarragona",
      locked: false,
    });
  });

  it("uses budget snapshot for invoiced with client_name, locked: true", () => {
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
