"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileDown, Eye, Pencil, Trash2 } from "lucide-react";
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
import { normalizeBudgetStatus } from "@/features/budgets/lib/budgetStatus";

export function BudgetListItemActions({
  budgetId,
  budgetStatus,
  budgetLang,
  invoiceId,
  variant = "full",
}: {
  budgetId: string;
  budgetStatus?: string | null;
  budgetLang?: string | null;
  invoiceId?: string | null;
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
  const router = useRouter();

  const isApproved = normalizeBudgetStatus(budgetStatus) === "approved";
  const isInvoiced = normalizeBudgetStatus(budgetStatus) === "invoiced";

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
        title: (l.title ?? "").trim() || "Linia",
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
                  "..."
                ) : (
                  <FileDown size={18} aria-hidden="true" />
                )
              ) : generating ? (
                "PDF..."
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
                "..."
              ) : (
                <Trash2 size={18} aria-hidden="true" />
              )
            ) : deleting ? (
              "..."
            ) : (
              "Eliminar"
            )}
          </button>
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar pressupost?"
        description="Aquesta accio eliminara el pressupost i totes les seves partides. No es pot desfer."
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
        description="El contacte ja no te pressupostos ni factures associades. Vols eliminar-lo tambe?"
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
    </div>
  );
}
