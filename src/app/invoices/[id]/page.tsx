import { notFound } from "next/navigation";
import { InvoiceView } from "@/components/InvoiceView";
import {
  getInvoiceById,
  getInvoiceLinesByInvoiceId,
} from "@/lib/invoices";
import { getBudgetById, getClientById } from "@/lib/budgets";
import styles from "./page.module.css";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);
  if (!invoice) notFound();

  const [client, lines, budget] = await Promise.all([
    getClientById(invoice.client_id),
    getInvoiceLinesByInvoiceId(invoice.id),
    invoice.budget_id ? getBudgetById(invoice.budget_id) : Promise.resolve(null),
  ]);

  const quoteNumber = budget?.quote_number ?? null;

  return (
    <main className={styles.main}>
      <InvoiceView
        invoice={invoice}
        client={client}
        lines={lines}
        quoteNumber={quoteNumber}
      />
    </main>
  );
}
