import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

type BudgetAddressRow = {
  job_address_street: string | null;
  job_address_postal_code: string | null;
  job_address_city: string | null;
};

let mockBudgetRows: BudgetAddressRow[] = [];

vi.mock("@/core/lib/supabaseClient", () => ({
  getSupabaseClient: () => ({
    from: (table: string) => {
      if (table === "budgets") {
        return {
          select: () => ({
            eq: () => ({
              order: () =>
                Promise.resolve({ data: mockBudgetRows, error: null }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  }),
}));

import { getContactJobAddresses } from "@/features/contacts/lib/contacts";

describe("getContactJobAddresses", () => {
  beforeEach(() => {
    mockBudgetRows = [];
  });

  it("returns one address when two budgets share the same job address", async () => {
    mockBudgetRows = [
      {
        job_address_street: "Carrer Major 10",
        job_address_postal_code: "08001",
        job_address_city: "Barcelona",
      },
      {
        job_address_street: "Carrer Major 10",
        job_address_postal_code: "08001",
        job_address_city: "Barcelona",
      },
    ];

    const addresses = await getContactJobAddresses("contact-1");

    expect(addresses).toHaveLength(1);
    expect(addresses[0]).toEqual({
      street: "Carrer Major 10",
      postalCode: "08001",
      city: "Barcelona",
    });
  });

  it("returns two addresses when budgets have distinct job addresses", async () => {
    mockBudgetRows = [
      {
        job_address_street: "Carrer Major 10",
        job_address_postal_code: "08001",
        job_address_city: "Barcelona",
      },
      {
        job_address_street: "Avinguda Diagonal 200",
        job_address_postal_code: "08018",
        job_address_city: "Barcelona",
      },
    ];

    const addresses = await getContactJobAddresses("contact-1");

    expect(addresses).toHaveLength(2);
  });

  it("skips budgets with no job address fields", async () => {
    mockBudgetRows = [
      {
        job_address_street: null,
        job_address_postal_code: null,
        job_address_city: null,
      },
      {
        job_address_street: "Plaça Catalunya 1",
        job_address_postal_code: "08002",
        job_address_city: "Barcelona",
      },
    ];

    const addresses = await getContactJobAddresses("contact-1");

    expect(addresses).toHaveLength(1);
    expect(addresses[0].street).toBe("Plaça Catalunya 1");
  });
});
