import { describe, expect, it } from "vitest";
import type { InvoiceListRow } from "@/features/invoices/lib/invoices";
import { filterInvoices } from "@/features/invoices/lib/filterInvoices";

function makeInvoice(overrides: Partial<InvoiceListRow> = {}): InvoiceListRow {
  return {
    id: "i1",
    invoice_number: "2025-001",
    client_name: "Joan García",
    issue_date: "2025-03-15",
    total: 1000,
    status: "issued",
    pricing_mode: "without_iva",
    ...overrides,
  };
}

describe("filterInvoices", () => {
  describe("query filter", () => {
    it("empty query returns all items", () => {
      const items = [
        makeInvoice({ id: "a" }),
        makeInvoice({ id: "b", invoice_number: "2025-002" }),
      ];
      expect(
        filterInvoices(items, { query: "", selectedStatus: null })
      ).toEqual(items);
      expect(
        filterInvoices(items, { query: "   ", selectedStatus: null })
      ).toEqual(items);
    });

    it("query matches invoice_number returns matching item", () => {
      const items = [
        makeInvoice({ id: "x", invoice_number: "2025-AAA" }),
        makeInvoice({ id: "y", invoice_number: "2025-BBB" }),
      ];
      const result = filterInvoices(items, {
        query: "AAA",
        selectedStatus: null,
      });
      expect(result).toEqual([items[0]]);
    });

    it("query matches client_name returns matching item", () => {
      const items = [
        makeInvoice({ id: "x", client_name: "Pere Soler" }),
        makeInvoice({ id: "y", client_name: "Maria Puig" }),
      ];
      const result = filterInvoices(items, {
        query: "Puig",
        selectedStatus: null,
      });
      expect(result).toEqual([items[1]]);
    });

    it("query is case-insensitive: joan matches Joan García", () => {
      const items = [makeInvoice()];
      expect(
        filterInvoices(items, { query: "joan", selectedStatus: null })
      ).toEqual(items);
    });

    it("query matches nothing returns empty array", () => {
      const items = [makeInvoice()];
      expect(
        filterInvoices(items, {
          query: "xyznonexistent",
          selectedStatus: null,
        })
      ).toEqual([]);
    });

    it("null invoice_number and null client_name does not crash; excluded by query", () => {
      const items = [
        makeInvoice({
          id: "empty",
          invoice_number: null,
          client_name: null,
        }),
        makeInvoice({
          id: "ok",
          invoice_number: null,
          client_name: "Searchable Client SA",
        }),
      ];
      const result = filterInvoices(items, {
        query: "search",
        selectedStatus: null,
      });
      expect(result).toEqual([items[1]]);
    });
  });

  describe("status filter", () => {
    it("selectedStatus null returns all items", () => {
      const items = [
        makeInvoice({ id: "a", status: "issued" }),
        makeInvoice({ id: "b", status: "paid" }),
      ];
      expect(
        filterInvoices(items, { query: "", selectedStatus: null })
      ).toEqual(items);
    });

    it('selectedStatus "issued" returns only issued invoices', () => {
      const items = [
        makeInvoice({ id: "a", status: "issued" }),
        makeInvoice({ id: "b", status: "paid" }),
        makeInvoice({ id: "c", status: "draft" }),
      ];
      const result = filterInvoices(items, {
        query: "",
        selectedStatus: "issued",
      });
      expect(result).toEqual([items[0]]);
    });

    it('selectedStatus "paid" returns only paid invoices', () => {
      const items = [
        makeInvoice({ id: "a", status: "issued" }),
        makeInvoice({ id: "b", status: "paid" }),
      ];
      const result = filterInvoices(items, {
        query: "",
        selectedStatus: "paid",
      });
      expect(result).toEqual([items[1]]);
    });
  });

  describe("combined", () => {
    it("query and status both applied (AND logic)", () => {
      const items = [
        makeInvoice({
          id: "1",
          client_name: "Joan García",
          status: "issued",
        }),
        makeInvoice({
          id: "2",
          client_name: "Joan Martí",
          status: "paid",
        }),
        makeInvoice({
          id: "3",
          client_name: "Pere García",
          status: "issued",
        }),
      ];
      const result = filterInvoices(items, {
        query: "joan",
        selectedStatus: "issued",
      });
      expect(result).toEqual([items[0]]);
    });
  });
});
