"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Eye, Search } from "lucide-react";
import type { InvoiceListRow } from "@/features/invoices/lib/invoices";
import { filterInvoices } from "@/features/invoices/lib/filterInvoices";
import { formatEUR } from "@/shared/lib/formatCurrency";
import { useClickOutside } from "@/shared/hooks/useClickOutside";
import styles from "./InvoicesView.module.css";
import InvoiceStatusPill from "./InvoiceStatusPill";

type InvoiceStatus = "draft" | "issued" | "paid";

const STATUS_OPTIONS: InvoiceStatus[] = ["issued", "paid"];

const statusLabel = (s: string): string => {
  switch (s) {
    case "draft":
      return "Esborrany";
    case "issued":
      return "Emesa";
    case "paid":
      return "Cobrada";
    default:
      return s;
  }
};

type Props = {
  invoices: InvoiceListRow[];
};

export function InvoicesView({ invoices }: Props) {
  const [statusOverrides, setStatusOverrides] = useState<Map<string, string>>(
    () => new Map()
  );
  const [query, setQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<InvoiceStatus | null>(
    null
  );
  const [menuOpen, setMenuOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useClickOutside(dropdownRef, menuOpen, closeMenu);

  const filtered = useMemo(
    () => filterInvoices(invoices, { query, selectedStatus }),
    [invoices, query, selectedStatus]
  );

  const dateFmt = new Intl.DateTimeFormat("ca-ES", { dateStyle: "medium" });

  return (
    <div className={styles.viewRoot}>
      {/* ── Filter row ── */}
      <div className={styles.filterRow}>
        <div className={styles.search}>
          <span className={styles.searchIcon} aria-hidden="true">
            <Search size={14} />
          </span>
          <input
            className={`${styles.input} ${styles.searchInput}`}
            placeholder="Cerca per núm. factura o client"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Cerca factures"
          />
        </div>

        <div className={styles.dropdownWrap} ref={dropdownRef}>
          <button
            type="button"
            className={`${styles.dropdownBtn} ${selectedStatus !== null ? styles.dropdownActive : ""}`}
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className={styles.dropdownLabel}>Estat</span>
            {selectedStatus !== null ? (
              <span className={styles.goldDot} aria-hidden="true" />
            ) : null}
            <span className={styles.chevron} aria-hidden="true">
              ▾
            </span>
          </button>

          <div
            className={`${styles.menu} ${menuOpen ? styles.menuOpen : ""}`}
            role="menu"
            aria-label="Seleccionar estat"
          >
            <label className={styles.menuRow}>
              <input
                className={styles.radio}
                type="radio"
                name="invoiceStatus"
                checked={selectedStatus === null}
                onChange={() => {
                  setSelectedStatus(null);
                  setMenuOpen(false);
                }}
              />
              <span>Tots</span>
            </label>
            {STATUS_OPTIONS.map((s) => (
              <label key={s} className={styles.menuRow}>
                <input
                  className={styles.radio}
                  type="radio"
                  name="invoiceStatus"
                  checked={selectedStatus === s}
                  onChange={() => {
                    setSelectedStatus(s);
                    setMenuOpen(false);
                  }}
                />
                <span>{statusLabel(s)}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.filterMeta} aria-live="polite">
          <span className={styles.results}>
            {filtered.length} de {invoices.length}
          </span>
        </div>
      </div>

      {/* ── Table ── */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Núm. factura</th>
              <th className={styles.th}>Client</th>
              <th className={styles.th}>Data emissió</th>
              <th className={styles.th}>Total</th>
              <th className={`${styles.th} ${styles.colStatus}`}>Estat</th>
              <th className={`${styles.th} ${styles.colActions}`}>Accions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((invoice) => (
              <tr key={invoice.id} className={styles.tr}>
                <td className={`${styles.td} ${styles.colInvoiceNum}`}>
                  {invoice.invoice_number ?? "—"}
                </td>
                <td className={`${styles.td} ${styles.colClient}`}>
                  {invoice.client_name ?? "—"}
                </td>
                <td className={`${styles.td} ${styles.colDate}`}>
                  {invoice.issue_date
                    ? dateFmt.format(new Date(invoice.issue_date))
                    : "—"}
                </td>
                <td className={styles.td}>{formatEUR(invoice.total ?? 0)}</td>
                <td className={`${styles.td} ${styles.colStatus}`}>
                  <InvoiceStatusPill
                    invoiceId={invoice.id}
                    initialStatus={
                      statusOverrides.get(invoice.id) ?? invoice.status
                    }
                    onStatusChange={(next) =>
                      setStatusOverrides((prev) =>
                        new Map(prev).set(invoice.id, next)
                      )
                    }
                  />
                </td>
                <td className={`${styles.td} ${styles.colActions}`}>
                  <span className={styles.rowActions}>
                    <Link
                      href={`/invoices/${invoice.id}`}
                      aria-label="Veure factura"
                    >
                      <button
                        className={styles.iconBtn}
                        type="button"
                        tabIndex={-1}
                      >
                        <Eye size={16} />
                      </button>
                    </Link>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
