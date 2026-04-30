import { formatEUR } from "@/lib/formatCurrency";
import type { ClientRow } from "@/types/budgetsDb";
import type { InvoiceLineRow, InvoiceRow } from "@/lib/invoices";
import { invoicePricingLabel } from "@/types/invoice";
import styles from "./InvoiceView.module.css";

function formatDate(value: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("ca-ES", { dateStyle: "medium" }).format(d);
}

export function InvoiceView({
  invoice,
  client,
  lines,
  quoteNumber,
}: {
  invoice: InvoiceRow;
  client: ClientRow;
  lines: InvoiceLineRow[];
  quoteNumber: string | null;
}) {
  const createdAt = formatDate(invoice.created_at ?? null);
  const subtotal =
    typeof invoice.subtotal === "number"
      ? invoice.subtotal
      : lines.reduce((sum, l) => sum + (l.subtotal ?? 0), 0);
  const total = typeof invoice.total === "number" ? invoice.total : subtotal;
  const taxAmount =
    typeof invoice.tax_amount === "number" ? invoice.tax_amount : 0;
  const taxRate = typeof invoice.tax_rate === "number" ? invoice.tax_rate : 0;

  const quoteDisplay = (quoteNumber ?? "").trim() || "—";

  return (
    <section className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>Factura</h1>
        <div className={styles.meta}>
          <span className={styles.pricingBadge} title="Tipus de factura">
            {invoicePricingLabel(invoice.pricing_mode)}
          </span>
          <span>Pressupost núm.: {quoteDisplay}</span>
          {createdAt ? <span>Data: {createdAt}</span> : null}
        </div>
      </header>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Client</h2>
        <div className={styles.clientGrid}>
          <div className={styles.kv}>
            <span className={styles.k}>Nom</span>
            <span className={styles.v}>
              {(client.name ?? "").trim() || "—"}
            </span>
          </div>
          <div className={styles.kv}>
            <span className={styles.k}>Telèfon</span>
            <span className={styles.v}>
              {(client.phone ?? "").trim() || "—"}
            </span>
          </div>
          <div className={styles.kv}>
            <span className={styles.k}>Adreça</span>
            <span className={styles.v}>
              {(client.address ?? "").trim() || "—"}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Descripció</th>
              <th className={`${styles.th} ${styles.num}`}>Quant.</th>
              <th className={`${styles.th} ${styles.num}`}>Preu</th>
              <th className={`${styles.th} ${styles.num}`}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id}>
                <td className={styles.td}>
                  {(l.description ?? "").trim() || "—"}
                </td>
                <td className={`${styles.td} ${styles.num}`}>
                  {typeof l.quantity === "number" ? l.quantity : "—"}
                </td>
                <td className={`${styles.td} ${styles.num}`}>
                  {typeof l.unit_price === "number"
                    ? formatEUR(l.unit_price)
                    : "—"}
                </td>
                <td className={`${styles.td} ${styles.num}`}>
                  {typeof l.subtotal === "number" ? formatEUR(l.subtotal) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={styles.totals}>
          <span className={styles.totalLabel}>Subtotal</span>
          <span className={styles.totalValue}>{formatEUR(subtotal)}</span>
          <span className={styles.totalLabel}>
            {taxRate > 0 ? `IVA (${taxRate}%)` : "IVA"}
          </span>
          <span className={styles.totalValue}>{formatEUR(taxAmount)}</span>
          <span className={styles.grandTotalLabel}>Total</span>
          <span className={styles.grandTotalValue}>{formatEUR(total)}</span>
        </div>
      </div>
    </section>
  );
}
