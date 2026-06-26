import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { contactHasReferences, contactHasExtraData } from "./contacts";

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
