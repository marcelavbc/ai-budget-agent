"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileDown, Eye, Pencil, Trash2, Receipt } from "lucide-react";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import styles from "./BudgetListItemActions.module.css";
import { usePdfExport } from "@/features/budgets/hooks/usePdfExport";
import type {
  BudgetClientDetails,
  BudgetClientItem,
} from "@/features/budgets/types/budget";
import type {
  BudgetLineRow,
  BudgetRow,
} from "@/features/budgets/types/budgetsDb";
import type { ContactRow } from "@/features/contacts/lib/contacts";
import {
  deleteBudgetWithLines,
  getBudgetExportData,
} from "@/features/budgets/lib/budgetsClient";
import { deleteContact } from "@/features/contacts/lib/contactsClient";
import {
  createInvoiceFromBudget,
} from "@/features/invoices/lib/invoicesClient";
import { normalizeBudgetStatus } from "@/features/budgets/lib/budgetStatus";

function hasNonEmpty(value: string | null | undefined): boolean {
  return Boolean((value ?? "").trim());
}

export function BudgetListItemActions({
  budgetId,
  budgetStatus,
  budgetLang,
  invoiceId,
  clientName,
  clientTaxId,
  clientAddressStreet,
  clientAddressPostalCode,
  clientAddressCity,
  taxRate,
  variant = "full",
}: {
  budgetId: string;
  budgetStatus?: string | null;
  budgetLang?: string | null;
  invoiceId?: string | null;
  clientName: string | null;
  clientTaxId: string | null;
  clientAddressStreet?: string | null;
  clientAddressPostalCode?: string | null;
  clientAddressCity?: string | null;
  taxRate?: number | null;
  variant?: "full" | "icons";
}) {
  const { exportPdf, generating, pdfError, setPdfError } = usePdfExport();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [orphanContactId, setOrphanContactId] = useState<string | null>(null);
  const [contactDeleting, setContactDeleting] = useState(false);
  const [contactDeleteError, setContactDeleteError] = useState<string | null>(
    null
  );
  const [invoiceConfirmOpen, setInvoiceConfirmOpen] = useState(false);
  const [isInvoicing, startInvoicing] = useTransition();
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const router = useRouter();

  const isApproved = normalizeBudgetStatus(budgetStatus) === "approved";
  const isInvoiced = normalizeBudgetStatus(budgetStatus) === "invoiced";
  const missingInvoiceFields: string[] = [];

  if (!hasNonEmpty(clientTaxId)) missingInvoiceFields.push("NIF/NIE");

  const missingAddressParts = [
    hasNonEmpty(clientAddressStreet),
    hasNonEmpty(clientAddressPostalCode),
    hasNonEmpty(clientAddressCity),
  ];
  if (!missingAddressParts.every(Boolean)) {
    missingInvoiceFields.push("adreca fiscal completa");
  }

  if (taxRate == null) missingInvoiceFields.push("IVA");

  const canInvoice = missingInvoiceFields.length === 0;
  const missingInvoiceMessage =
    missingInvoiceFields.length > 0
      ? `Falta: ${missingInvoiceFields.join(", ")}`
      : null;

  async function handleGeneratePdf(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    const lang = budgetLang === "es" ? "es" : "ca";
    try {
      const data = (await getBudgetExportData(budgetId)) as unknown;
      if (typeof data !== "object" || data === null) {
        throw new Error("No s'ha pogut generar el PDF. Torna-ho a provar.");
      }
      const budget = (data as { budget?: unknown }).budget as
        | BudgetRow
        | undefined;
      const client = (data as { client?: unknown }).client as
        | ContactRow
        | undefined;
      const lines = (data as { lines?: unknown }).lines as
        | BudgetLineRow[]
        | undefined;
      if (!budget || !client || !Array.isArray(lines)) {
        throw new Error("No s'ha pogut generar el PDF. Torna-ho a provar.");
      }

      const itemsForPdf: BudgetClientItem[] = lines.map((l) => ({
        id: l.id,
        title: (l.title ?? "").trim() || "Línia",
        description: (l.description ?? "").trim(),
        total: l.line_total ?? 0,
        quantity: l.quantity ?? undefined,
        unitLabel: (l.unit ?? undefined) as BudgetClientItem["unitLabel"],
        unitPrice: l.unit_price ?? undefined,
        optionGroupId: (l.option_group_id ?? undefined) || undefined,
        optionLabel: (l.option_label ?? undefined) || undefined,
      }));

      const clientForPdf: BudgetClientDetails = {
        nameOrCompany: (client.name ?? "").trim(),
        jobAddressStreet: (budget.job_address_street ?? "").trim(),
        jobAddressPostalCode: (budget.job_address_postal_code ?? "").trim(),
        jobAddressCity: (budget.job_address_city ?? "").trim(),
        taxRate: budget.tax_rate ?? 0,
        quoteNumber: (budget.quote_number ?? "").trim(),
        date: (budget.document_date ?? "").trim(),
        estimatedTime: (budget.estimated_time ?? "").trim(),
        lang,
      };

      await exportPdf({
        client: clientForPdf,
        items: itemsForPdf,
      });
    } catch (err) {
      setPdfError(
        err instanceof Error
          ? err.message
          : "No s'ha pogut generar el PDF. Torna-ho a provar."
      );
    }
  }

  function handleDeleteClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (deleting) return;
    setConfirmOpen(true);
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const result = await deleteBudgetWithLines(budgetId);
      if (result.contactStatus === "pending_confirmation") {
        setOrphanContactId(result.contactId);
      } else {
        router.refresh();
      }
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : "No s'ha pogut eliminar el pressupost."
      );
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  function closeOrphanDialog() {
    setOrphanContactId(null);
    router.refresh();
  }

  async function handleConfirmDeleteContact() {
    if (!orphanContactId) return;
    setContactDeleting(true);
    setContactDeleteError(null);
    try {
      await deleteContact(orphanContactId);
    } catch (err) {
      setContactDeleteError(
        err instanceof Error
          ? err.message
          : "No s'ha pogut eliminar el contacte."
      );
    } finally {
      setContactDeleting(false);
      closeOrphanDialog();
    }
  }

  async function handleCreateInvoice() {
    setInvoiceConfirmOpen(false);
    setInvoiceError(null);
    startInvoicing(() => {
      void (async () => {
        try {
          const { invoiceId } = await createInvoiceFromBudget(budgetId);
          router.push(`/invoices/${invoiceId}`);
          router.refresh();
        } catch (err) {
          setInvoiceError(
            err instanceof Error
              ? err.message
              : "No s'ha pogut generar la factura."
          );
        }
      })();
    });
  }

  const nonEmptyInvoiceId = (invoiceId ?? "").trim();

  return (
    <div
      className={`${styles.root} ${variant === "icons" ? styles.rootIcons : ""}`}
    >
      {isInvoiced ? (
        <>
          {nonEmptyInvoiceId ? (
            <Link
              href={`/invoices/${nonEmptyInvoiceId}`}
              onClick={(e) => e.stopPropagation()}
              className={variant === "icons" ? styles.iconBtn : styles.btn}
              aria-label="Veure factura"
              title="Veure factura"
            >
              <Eye size={18} aria-hidden="true" />
            </Link>
          ) : null}
        </>
      ) : (
        <>
          {deleteError ? (
            <p className={styles.error} role="alert">
              {deleteError}
            </p>
          ) : null}
          <Link
            href={`/budgets/${budgetId}/edit`}
            onClick={(e) => e.stopPropagation()}
            className={variant === "icons" ? styles.iconBtn : styles.btn}
            aria-label="Editar pressupost"
            title="Editar"
          >
            {variant === "icons" ? (
              <Pencil size={18} aria-hidden="true" />
            ) : (
              "Editar"
            )}
          </Link>
          <button
            type="button"
            className={
              variant === "icons"
                ? styles.iconBtn
                : `${styles.btn} ${styles.primary}`
            }
            disabled={!canInvoice || isInvoicing}
            aria-busy={isInvoicing || undefined}
            aria-label="Generar factura"
            title={canInvoice ? "Generar factura" : missingInvoiceMessage ?? "Generar factura"}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!canInvoice || isInvoicing) return;
              setInvoiceConfirmOpen(true);
            }}
          >
            {variant === "icons" ? (
              isInvoicing ? (
                "…"
              ) : (
                <Receipt size={18} aria-hidden="true" />
              )
            ) : isInvoicing ? (
              "…"
            ) : (
              "Facturar"
            )}
          </button>
          {!canInvoice ? (
            <p className={styles.hint} role="note">
              {missingInvoiceMessage}
            </p>
          ) : null}
          {!isApproved ? (
            <button
              type="button"
              disabled={generating}
              className={
                variant === "icons"
                  ? styles.iconBtn
                  : `${styles.btn} ${styles.primary}`
              }
              aria-busy={generating || undefined}
              aria-label="Generar PDF"
              title="PDF"
              onClick={handleGeneratePdf}
            >
              {variant === "icons" ? (
                generating ? (
                  "…"
                ) : (
                  <FileDown size={18} aria-hidden="true" />
                )
              ) : generating ? (
                "PDF…"
              ) : (
                "PDF"
              )}
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleDeleteClick}
            disabled={deleting}
            className={
              variant === "icons"
                ? `${styles.iconBtn} ${styles.iconBtnDanger}`
                : `${styles.btn} ${styles.danger}`
            }
            aria-label="Eliminar pressupost"
            title="Eliminar"
          >
            {variant === "icons" ? (
              deleting ? (
                "…"
              ) : (
                <Trash2 size={18} aria-hidden="true" />
              )
            ) : deleting ? (
              "…"
            ) : (
              "Eliminar"
            )}
          </button>
        </>
      )}

      <ConfirmDialog
        open={!isInvoiced && invoiceConfirmOpen}
        title="Confirmar facturacio"
        description={`Aquesta accio es irreversible: el pressupost${(clientName ?? "").trim() ? ` de ${(clientName ?? "").trim()}` : ""} passara a facturat i ja no es podra editar.`}
        confirmLabel="Confirmar i facturar"
        cancelLabel="Cancel·lar"
        loading={isInvoicing}
        onClose={() => setInvoiceConfirmOpen(false)}
        onConfirm={handleCreateInvoice}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar pressupost?"
        description="Aquesta acció eliminarà el pressupost i totes les seves partides. No es pot desfer."
        confirmLabel="Eliminar"
        cancelLabel="Cancel·lar"
        destructive
        loading={deleting}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
      />

      <ConfirmDialog
        open={orphanContactId !== null}
        title="Eliminar contacte sense dades?"
        description="El contacte ja no té pressupostos ni factures associades. Vols eliminar-lo també?"
        confirmLabel="Eliminar contacte"
        cancelLabel="Mantenir"
        destructive
        loading={contactDeleting}
        onClose={closeOrphanDialog}
        onConfirm={handleConfirmDeleteContact}
      />

      {contactDeleteError ? (
        <p className={styles.error} role="alert">
          {contactDeleteError}
        </p>
      ) : null}

      {!isInvoiced && !isApproved && pdfError ? (
        <p className={styles.error} role="alert">
          {pdfError}
        </p>
      ) : null}
      {!isInvoiced && invoiceError ? (
        <p className={styles.error} role="alert">
          {invoiceError}
        </p>
      ) : null}
    </div>
  );
}
