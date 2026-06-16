"use client";

import { useState } from "react";
import { formatEUR } from "@/shared/lib/formatCurrency";
import {
  generateInvoicePdf,
  buildInvoicePdfFilename,
} from "@/features/invoices/lib/generateInvoicePdf";
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
  const [generatingPdf, setGeneratingPdf] = useState(false);

  async function handleDownloadPdf(lang: "ca" | "es") {
    setGeneratingPdf(true);

    try {
      const blob = await generateInvoicePdf({
        invoice: {
          invoice_number: invoice.invoice_number,
          issue_date: invoice.issue_date,
          due_date: invoice.due_date,
          pricing_mode: invoice.pricing_mode,
          subtotal: invoice.subtotal,
          tax_rate: invoice.tax_rate,
          tax_amount: invoice.tax_amount,
          total: invoice.total,
          job_address: invoice.job_address,
          project_name: invoice.project_name ?? null,
        },
        owner: settings ?? {
          owner_name: null,
          owner_address: null,
          owner_postal_code: null,
          owner_city: null,
          owner_nif: null,
          bank_iban: null,
        },
        client: {
          name: client.name,
          tax_id: client.tax_id ?? null,
          address_street: client.address_street ?? null,
          address_postal_code: client.address_postal_code ?? null,
          address_city: client.address_city ?? null,
        },
        lines,
        lang,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = buildInvoicePdfFilename(
        invoice.invoice_number,
        client.name,
        lang
      );
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setGeneratingPdf(false);
    }
  }

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
          <p className={styles.issuerDetail}>{settings?.owner_nif ?? ""}</p>
          <p className={styles.issuerDetail}>{settings?.owner_address ?? ""}</p>
          <p className={styles.issuerDetail}>
            {[settings?.owner_postal_code, settings?.owner_city]
              .filter(Boolean)
              .join(" ")}
          </p>
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
        <div className={styles.topActions}>
          <button
            type="button"
            className={styles.generateBudgetBtn}
            disabled={generatingPdf}
            aria-busy={generatingPdf || undefined}
            onClick={() =>
              handleDownloadPdf((invoice.lang as "ca" | "es") ?? "ca")
            }
          >
            {generatingPdf ? "Generant…" : "Descarregar PDF"}
          </button>
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
        {client.address_street ? (
          <>
            <p className={styles.clientDetail}>{client.address_street}</p>
            {(client.address_postal_code || client.address_city) && (
              <p className={styles.clientDetail}>
                {[client.address_postal_code, client.address_city]
                  .filter(Boolean)
                  .join(" ")}
              </p>
            )}
          </>
        ) : null}
      </div>

      {/* LINES TABLE */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Descripció</th>
            <th className={`${styles.th} ${styles.num}`}>Import</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.id}>
              <td className={styles.td}>
                {(l.description ?? "").trim() || "—"}
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
      {/* QUOTE REFERENCE */}
      {quoteNumber && (
        <div className={styles.reference}>
          <p className={styles.referenceText}>Pressupost núm.: {quoteNumber}</p>
        </div>
      )}
    </section>
  );
}
