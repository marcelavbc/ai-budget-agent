"use client";

import { useCallback, useRef, useState } from "react";
import { formatEUR } from "@/shared/lib/formatCurrency";
import {
  generateInvoicePdf,
  buildInvoicePdfFilename,
} from "@/features/invoices/lib/generateInvoicePdf";
import { useClickOutside } from "@/shared/hooks/useClickOutside";
import { ChevronDown } from "lucide-react";
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
  const [pdfMenuOpen, setPdfMenuOpen] = useState(false);
  const pdfMenuRef = useRef<HTMLDivElement | null>(null);
  const closePdfMenu = useCallback(() => setPdfMenuOpen(false), []);
  useClickOutside(pdfMenuRef, pdfMenuOpen, closePdfMenu);

  async function handleDownloadPdf(lang: "ca" | "es") {
    setPdfMenuOpen(false);
    setGeneratingPdf(true);

    try {
      const blob = await generateInvoicePdf({
        invoice,
        owner: settings ?? {
          owner_name: null,
          owner_address: null,
          owner_postal_city: null,
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
            {[settings?.owner_postal_city, settings?.owner_city]
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
        <div
          className={styles.topActions}
          ref={pdfMenuRef}
          onKeyDown={(e) => {
            if (e.key === "Escape") setPdfMenuOpen(false);
          }}
        >
          <button
            type="button"
            className={styles.generateBudgetBtn}
            disabled={generatingPdf}
            aria-busy={generatingPdf || undefined}
            aria-haspopup="menu"
            aria-expanded={pdfMenuOpen}
            onClick={() => setPdfMenuOpen((v) => !v)}
          >
            {generatingPdf ? (
              "Generant…"
            ) : (
              <>
                Descarregar PDF
                <ChevronDown size={14} aria-hidden="true" />
              </>
            )}
          </button>
          {pdfMenuOpen ? (
            <div className={styles.generateBudgetMenu} role="menu">
              <button
                type="button"
                className={styles.generateBudgetMenuItem}
                role="menuitem"
                disabled={generatingPdf}
                onClick={() => handleDownloadPdf("ca")}
              >
                Català{" "}
                <span className={styles.generateBudgetMenuHint}>PDF</span>
              </button>
              <button
                type="button"
                className={styles.generateBudgetMenuItem}
                role="menuitem"
                disabled={generatingPdf}
                onClick={() => handleDownloadPdf("es")}
              >
                Castellano{" "}
                <span className={styles.generateBudgetMenuHint}>PDF</span>
              </button>
            </div>
          ) : null}
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
