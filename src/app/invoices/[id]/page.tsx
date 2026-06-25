import { notFound } from "next/navigation";
import { InvoiceView } from "@/features/invoices/components/InvoiceView";
import {
  getInvoiceById,
  getInvoiceLinesByInvoiceId,
  getSettings,
} from "@/features/invoices/lib/invoices";
import { getBudgetById } from "@/features/budgets/lib/budgets";
import { getContactById } from "@/features/contacts/lib/contacts";
import styles from "./page.module.css";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);
  if (!invoice) notFound();

  const [contact, lines, budget, settings] = await Promise.all([
    getContactById(invoice.contact_id),
    getInvoiceLinesByInvoiceId(invoice.id),
    invoice.budget_id
      ? getBudgetById(invoice.budget_id)
      : Promise.resolve(null),
    getSettings(),
  ]);

  const quoteNumber = budget?.quote_number ?? null;

  return (
    <main className={styles.main}>
      <InvoiceView
        invoice={invoice}
        client={{
          name: invoice.client_name ?? contact.name,
          tax_id: invoice.client_tax_id ?? contact.tax_id,
          address_street:
            invoice.client_address_street ??
            contact.fiscal_address_street ??
            null,
          address_postal_code:
            invoice.client_address_postal_code ??
            contact.fiscal_address_postal_code ??
            null,
          address_city:
            invoice.client_address_city ?? contact.fiscal_address_city ?? null,
        }}
        lines={lines}
        quoteNumber={quoteNumber}
        settings={settings}
      />
    </main>
  );
}
