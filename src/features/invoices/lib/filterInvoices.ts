import type { InvoiceListRow } from "@/features/invoices/lib/invoices";

export function filterInvoices(
  invoices: InvoiceListRow[],
  filters: {
    query: string;
    selectedStatus: string | null;
  }
): InvoiceListRow[] {
  const q = filters.query.trim().toLowerCase();
  return invoices.filter((it) => {
    if (q) {
      const num = (it.invoice_number ?? "").toLowerCase();
      const client = (it.client_name ?? "").toLowerCase();
      if (!num.includes(q) && !client.includes(q)) return false;
    }
    if (filters.selectedStatus !== null && it.status !== filters.selectedStatus)
      return false;
    return true;
  });
}
