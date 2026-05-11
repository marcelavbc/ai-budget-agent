import { formatEUR } from "@/shared/lib/formatCurrency";
import type { ClientRow } from "@/features/budgets/types/budgetsDb";
import type {
  InvoiceLineRow,
  InvoiceRow,
  SettingsRow,
} from "@/features/invoices/lib/invoices";
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
  settings,
}: {
  invoice: InvoiceRow;
  client: ClientRow;
  lines: InvoiceLineRow[];
  quoteNumber: string | null;
  settings: SettingsRow | null;
}) {
  const subtotal =
    typeof invoice.subtotal === "number"
      ? invoice.subtotal
      : lines.reduce((sum, l) => sum + (l.subtotal ?? 0), 0);
  const total = typeof invoice.total === "number" ? invoice.total : subtotal;
  const taxAmount =
    typeof invoice.tax_amount === "number" ? invoice.tax_amount : 0;
  const taxRate = typeof invoice.tax_rate === "number" ? invoice.tax_rate : 0;
  const withIva = invoice.pricing_mode === "with_iva" && taxRate > 0;

  return (
    <section className={styles.root}>
      {/* TOP: two columns — issuer left, invoice meta right */}
      <div className={styles.docHeader}>
        <div className={styles.issuer}>
          <p className={styles.issuerName}>{settings?.owner_name ?? "—"}</p>
          <p className={styles.issuerDetail}>{settings?.owner_address ?? ""}</p>
          <p className={styles.issuerDetail}>
            {[settings?.owner_postal_city, settings?.owner_city]
              .filter(Boolean)
              .join(" ")}
          </p>
          <p className={styles.issuerDetail}>{settings?.owner_nif ?? ""}</p>
        </div>
        <div className={styles.invoiceMeta}>
          <p className={styles.invoiceNumber}>
            Factura:{invoice.invoice_number ?? "—"}
          </p>
          <p className={styles.metaLine}>
            Data d&apos;emissió: {formatDate(invoice.issue_date ?? null) ?? "—"}
          </p>
          {invoice.due_date && (
            <p className={styles.metaLine}>
              Venciment: {formatDate(invoice.due_date)}
            </p>
          )}
          {invoice.pricing_mode === "with_iva" && (
            <span className={styles.pricingBadge}>AMB IVA</span>
          )}
        </div>
      </div>

      <div className={styles.divider} />

      {/* CLIENT BLOCK */}
      <div className={styles.clientBlock}>
        <p className={styles.sectionLabel}>Client</p>
        <p className={styles.clientName}>{client.name ?? "—"}</p>
        {client.tax_id && (
          <p className={styles.clientDetail}>{client.tax_id}</p>
        )}
        {client.address && (
          <p className={styles.clientDetail}>{client.address}</p>
        )}
        {invoice.job_address && (
          <p className={styles.clientDetail}>Obra: {invoice.job_address}</p>
        )}
      </div>

      {/* LINES TABLE */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Descripció</th>
            <th className={`${styles.th} ${styles.num}`}>Quant.</th>
            <th className={`${styles.th} ${styles.num}`}>Preu unit.</th>
            <th className={`${styles.th} ${styles.num}`}>Total</th>
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

      {/* TOTALS */}
      <div className={styles.totals}>
        {withIva && (
          <>
            <span className={styles.totalLabel}>Subtotal</span>
            <span className={styles.totalValue}>{formatEUR(subtotal)}</span>
            <span className={styles.totalLabel}>IVA ({taxRate}%)</span>
            <span className={styles.totalValue}>{formatEUR(taxAmount)}</span>
          </>
        )}
        <span className={styles.grandTotalLabel}>Total</span>
        <span className={styles.grandTotalValue}>{formatEUR(total)}</span>
      </div>

      {/* PAYMENT */}
      {settings?.bank_iban && (
        <div className={styles.payment}>
          <p className={styles.paymentText}>
            Forma de pagament: Transferència a {settings.bank_iban}
          </p>
        </div>
      )}

      {/* QUOTE REFERENCE */}
      {quoteNumber && (
        <div className={styles.reference}>
          <p className={styles.referenceText}>Pressupost núm.: {quoteNumber}</p>
        </div>
      )}
    </section>
  );
}
