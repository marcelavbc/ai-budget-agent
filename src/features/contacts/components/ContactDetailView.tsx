"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ContactDetail } from "@/features/contacts/lib/contacts";
import { updateContact } from "@/features/contacts/lib/contactsClient";
import {
  budgetStatusLabel,
  normalizeBudgetStatus,
  type BudgetStatus,
} from "@/features/budgets/lib/budgetStatus";
import { formatEUR } from "@/shared/lib/formatCurrency";
import styles from "./ContactDetailView.module.css";

type Props = {
  detail: ContactDetail;
};

type FormState = {
  name: string;
  phone: string;
  tax_id: string;
  fiscal_address_street: string;
  fiscal_address_postal_code: string;
  fiscal_address_city: string;
};

const FORM_KEYS = [
  "name",
  "phone",
  "tax_id",
  "fiscal_address_street",
  "fiscal_address_postal_code",
  "fiscal_address_city",
] as const satisfies readonly (keyof FormState)[];

function contactToForm(contact: ContactDetail["contact"]): FormState {
  return {
    name: contact.name ?? "",
    phone: contact.phone ?? "",
    tax_id: contact.tax_id ?? "",
    fiscal_address_street: contact.fiscal_address_street ?? "",
    fiscal_address_postal_code: contact.fiscal_address_postal_code ?? "",
    fiscal_address_city: contact.fiscal_address_city ?? "",
  };
}

function buildPatch(
  form: FormState,
  baseline: FormState
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  for (const key of FORM_KEYS) {
    const next = form[key].trim();
    const prev = baseline[key].trim();
    if (next !== prev) {
      patch[key] = next || null;
    }
  }
  return patch;
}

function formatDateDDMMYYYY(value: string | null): string {
  const v = (value ?? "").trim();
  if (!v) return "—";
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function invoiceStatusLabel(status: string): string {
  switch (status) {
    case "draft":
      return "Esborrany";
    case "sent":
      return "Emesa";
    case "paid":
      return "Cobrada";
    default:
      return status;
  }
}

function invoicePillClass(status: string): string {
  if (status === "sent") return styles.pillSent;
  if (status === "paid") return styles.pillApproved;
  return styles.pillDraft;
}

function displayField(value: string): string {
  return value.trim() || "—";
}

function formatFiscalAddressSummary(form: FormState): string {
  const street = form.fiscal_address_street.trim();
  const locality = [form.fiscal_address_postal_code, form.fiscal_address_city]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" ");
  const parts = [street, locality].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "—";
}

function budgetPillClass(status: BudgetStatus): string {
  if (status === "invoiced") return styles.pillInvoiced;
  return styles.pillDraft;
}

export function ContactDetailView({ detail }: Props) {
  const [editing, setEditing] = useState(false);
  const [baseline, setBaseline] = useState(() => contactToForm(detail.contact));
  const [form, setForm] = useState(() => contactToForm(detail.contact));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patch = useMemo(() => buildPatch(form, baseline), [form, baseline]);
  const hasChanges = Object.keys(patch).length > 0;

  const budgetStatusEntries = useMemo(
    () => Object.entries(detail.totals.budgetCountByStatus),
    [detail.totals.budgetCountByStatus]
  );

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!hasChanges || saving) return;
    setError(null);
    setSaving(true);
    try {
      await updateContact(detail.contact.id, patch);
      setBaseline({ ...form });
      setEditing(false);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "No s'ha pogut actualitzar el contacte."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setForm({ ...baseline });
    setError(null);
    setEditing(false);
  }

  return (
    <div className={styles.root}>
      <header className={styles.topBar}>
        <Link href="/contacts" className={styles.backBtn}>
          Tornar
        </Link>
      </header>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Dades del contacte</h3>
        {!editing ? (
          <div className={styles.clientSection}>
            <div className={styles.clientSummary}>
              <div className={styles.clientSummaryText}>
                <span className={styles.clientSummaryName}>
                  {displayField(form.name)}
                </span>
                <span>Telèfon: {displayField(form.phone)}</span>
                <span>NIF: {displayField(form.tax_id)}</span>
                <span>Adreça fiscal: {formatFiscalAddressSummary(form)}</span>
              </div>
              <button
                type="button"
                className={styles.linkLike}
                onClick={() => {
                  setError(null);
                  setEditing(true);
                }}
              >
                Editar dades
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.clientSection}>
            <button
              type="button"
              className={styles.linkLike}
              onClick={() => setEditing(false)}
            >
              Amagar dades
            </button>
            <div className={styles.fields}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Nom o empresa</span>
                <input
                  className={styles.fieldInput}
                  type="text"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  autoComplete="organization"
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Telèfon</span>
                <input
                  className={styles.fieldInput}
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  autoComplete="tel"
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>NIF</span>
                <input
                  className={styles.fieldInput}
                  type="text"
                  value={form.tax_id}
                  onChange={(e) => setField("tax_id", e.target.value)}
                />
              </label>
              <div className={styles.fieldGroup}>
                <p className={styles.fieldGroupTitle}>Adreça fiscal</p>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Carrer i número</span>
                  <input
                    className={styles.fieldInput}
                    type="text"
                    value={form.fiscal_address_street}
                    onChange={(e) =>
                      setField("fiscal_address_street", e.target.value)
                    }
                    autoComplete="street-address"
                  />
                </label>
                <div className={styles.fieldRow}>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Codi postal</span>
                    <input
                      className={styles.fieldInput}
                      type="text"
                      value={form.fiscal_address_postal_code}
                      onChange={(e) =>
                        setField("fiscal_address_postal_code", e.target.value)
                      }
                      autoComplete="postal-code"
                    />
                  </label>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Població</span>
                    <input
                      className={styles.fieldInput}
                      type="text"
                      value={form.fiscal_address_city}
                      onChange={(e) =>
                        setField("fiscal_address_city", e.target.value)
                      }
                      autoComplete="address-level2"
                    />
                  </label>
                </div>
              </div>
            </div>
            <div className={styles.formFooter}>
              {error ? (
                <p className={styles.saveError} role="alert">
                  {error}
                </p>
              ) : null}
              <div className={styles.formFooterBtns}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel·lar
                </button>
                <button
                  type="button"
                  className={styles.saveBtn}
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                >
                  {saving ? "Guardant…" : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Resum</h3>
        <div className={styles.totalsGrid}>
          <div className={styles.totalCard}>
            <span className={styles.totalLabel}>Total emès</span>
            <span className={styles.totalValue}>
              {formatEUR(detail.totals.totalIssued)}
            </span>
          </div>
          <div className={styles.totalCard}>
            <span className={styles.totalLabel}>Total cobrat</span>
            <span className={styles.totalValue}>
              {formatEUR(detail.totals.totalPaid)}
            </span>
          </div>
        </div>
        {budgetStatusEntries.length > 0 ? (
          <div className={styles.statusSummary}>
            <h3 className={styles.statusSummaryTitle}>
              Pressupostos per estat
            </h3>
            <ul className={styles.statusList}>
              {budgetStatusEntries.map(([status, count]) => (
                <li key={status} className={styles.statusListItem}>
                  <span>
                    {budgetStatusLabel(normalizeBudgetStatus(status))}
                  </span>
                  <span className={styles.statusCount}>{count}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Pressupostos</h3>
        {detail.budgets.length === 0 ? (
          <p className={styles.emptyText}>Cap pressupost associat.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Núm.</th>
                  <th className={styles.th}>Obra/Títol</th>
                  <th className={`${styles.th} ${styles.colStatus}`}>Estat</th>
                  <th className={styles.th}>Data</th>
                  <th className={styles.th}>Import</th>
                </tr>
              </thead>
              <tbody>
                {detail.budgets.map((budget) => {
                  const status = normalizeBudgetStatus(budget.status);
                  return (
                    <tr key={budget.id} className={styles.tr}>
                      <td className={`${styles.td} ${styles.colNum}`}>
                        <Link
                          className={styles.rowLink}
                          href={`/budgets/${budget.id}/edit`}
                        >
                          {budget.quote_number?.trim() || "—"}
                        </Link>
                      </td>
                      <td className={`${styles.td} ${styles.colTitle}`}>
                        <Link
                          className={styles.rowLink}
                          href={`/budgets/${budget.id}/edit`}
                        >
                          {budget.title?.trim() || "—"}
                        </Link>
                      </td>
                      <td className={`${styles.td} ${styles.colStatus}`}>
                        <span
                          className={`${styles.pill} ${budgetPillClass(status)}`}
                        >
                          {budgetStatusLabel(status)}
                        </span>
                      </td>
                      <td className={`${styles.td} ${styles.colDate}`}>
                        {formatDateDDMMYYYY(budget.document_date)}
                      </td>
                      <td className={styles.td}>
                        {budget.subtotal != null
                          ? formatEUR(budget.subtotal)
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Factures</h3>
        {detail.invoices.length === 0 ? (
          <p className={styles.emptyText}>Cap factura associada.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Núm.</th>
                  <th className={`${styles.th} ${styles.colStatus}`}>Estat</th>
                  <th className={styles.th}>Data</th>
                  <th className={styles.th}>Import</th>
                </tr>
              </thead>
              <tbody>
                {detail.invoices.map((invoice) => (
                  <tr key={invoice.id} className={styles.tr}>
                    <td className={`${styles.td} ${styles.colNum}`}>
                      <Link
                        className={styles.rowLink}
                        href={`/invoices/${invoice.id}`}
                      >
                        {invoice.invoice_number?.trim() || "—"}
                      </Link>
                    </td>
                    <td className={`${styles.td} ${styles.colStatus}`}>
                      <span
                        className={`${styles.pill} ${invoicePillClass(invoice.status)}`}
                      >
                        {invoiceStatusLabel(invoice.status)}
                      </span>
                    </td>
                    <td className={`${styles.td} ${styles.colDate}`}>
                      {formatDateDDMMYYYY(invoice.issue_date)}
                    </td>
                    <td className={styles.td}>
                      {formatEUR(invoice.total ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
