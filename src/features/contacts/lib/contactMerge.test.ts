import { describe, expect, it } from "vitest";
import type { Tables } from "@/core/types/supabase";
import {
  suggestMergeSurvivorWithJobAddresses,
  suggestMergeSurvivorAmongWithJobAddresses,
} from "./contactMerge";

type ContactRow = Tables<"contacts">;

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

describe("suggestMergeSurvivorWithJobAddresses", () => {
  it("prefers more job addresses when filled fields are equal", () => {
    const older = makeContactRow({
      id: "older",
      name: "Lola",
      created_at: "2020-01-01T00:00:00.000Z",
    });
    const newer = makeContactRow({
      id: "newer",
      name: "Lola Pastanaga",
      created_at: "2025-01-01T00:00:00.000Z",
    });

    expect(
      suggestMergeSurvivorWithJobAddresses(older, newer, {
        older: 2,
        newer: 0,
      })
    ).toBe(older);

    expect(
      suggestMergeSurvivorWithJobAddresses(older, newer, {
        older: 0,
        newer: 2,
      })
    ).toBe(newer);
  });
});

describe("suggestMergeSurvivorAmongWithJobAddresses", () => {
  it("returns the contact with the most job addresses among equals", () => {
    const a = makeContactRow({ id: "a", created_at: "2024-01-01T00:00:00.000Z" });
    const b = makeContactRow({ id: "b", created_at: "2023-01-01T00:00:00.000Z" });
    const c = makeContactRow({ id: "c", created_at: "2025-01-01T00:00:00.000Z" });

    expect(
      suggestMergeSurvivorAmongWithJobAddresses([a, b, c], {
        a: 0,
        b: 1,
        c: 3,
      })
    ).toBe(c);
  });
});
