"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useClickOutside } from "@/shared/hooks/useClickOutside";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileDown,
  Eye,
  Pencil,
  Trash2,
  ChevronDown,
  Receipt,
} from "lucide-react";
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
  ClientRow,
} from "@/features/budgets/types/budgetsDb";
import {
  deleteBudgetWithLines,
  getBudgetExportData,
} from "@/features/budgets/lib/budgetsClient";
import {
  createInvoiceFromBudget,
  updateClientAddress,
  updateClientTaxId,
} from "@/features/invoices/lib/invoicesClient";
import { InvoiceModal } from "@/features/invoices/components/InvoiceModal";
import { useInvoiceModal } from "@/features/invoices/hooks/useInvoiceModal";
import { normalizeBudgetStatus } from "@/features/budgets/lib/budgetStatus";
import type { InvoicePricingMode } from "@/features/invoices/types/invoice";

export function BudgetListItemActions({
  budgetId,
  budgetStatus,
  invoiceId,
  clientName,
  clientTaxId,
  variant = "full",
}: {
  budgetId: string;
  budgetStatus?: string | null;
  invoiceId?: string | null;
  clientName: string | null;
  clientTaxId: string | null;
  variant?: "full" | "icons";
}) {
  const { exportPdf, generating, pdfError, setPdfError } = usePdfExport();
  const [pdfMenuOpen, setPdfMenuOpen] = useState(false);
  const pdfMenuRef = useRef<HTMLDivElement | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const modal = useInvoiceModal(clientTaxId, budgetId);
  const [isInvoicing, startInvoicing] = useTransition();
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const router = useRouter();

  const isApproved = normalizeBudgetStatus(budgetStatus) === "approved";
  const isInvoiced = normalizeBudgetStatus(budgetStatus) === "invoiced";

  const closePdfMenu = useCallback(() => setPdfMenuOpen(false), []);
  useClickOutside(pdfMenuRef, pdfMenuOpen, closePdfMenu);

  async function handleGeneratePdfLang(
    e: React.MouseEvent<HTMLButtonElement>,
    lang: "ca" | "es"
  ) {
    e.preventDefault();
    e.stopPropagation();
    setPdfMenuOpen(false);
    try {
      const data = (await getBudgetExportData(budgetId)) as unknown;
      if (typeof data !== "object" || data === null) {
        throw new Error("No s'ha pogut generar el PDF. Torna-ho a provar.");
      }
      const budget = (data as { budget?: unknown }).budget as
        | BudgetRow
        | undefined;
      const client = (data as { client?: unknown }).client as
        | ClientRow
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
        addressStreet: (client.address_street ?? "").trim(),
        addressPostalCode: (client.address_postal_code ?? "").trim(),
        addressCity: (client.address_city ?? "").trim(),
        quoteNumber: (budget.quote_number ?? "").trim(),
        date: (budget.document_date ?? "").trim(),
        estimatedTime: (budget.estimated_time ?? "").trim(),
        lang: "ca" as const,
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
      await deleteBudgetWithLines(budgetId);
      router.refresh();
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

  async function handleCreateInvoice(pricingMode: InvoicePricingMode) {
    modal.closeModal();
    setInvoiceError(null);
    startInvoicing(() => {
      void (async () => {
        try {
          // Guardar NIF al client si s'ha introduït
          if (
            modal.taxId.trim() &&
            modal.taxId.trim() !== (clientTaxId ?? "").trim()
          ) {
            await updateClientTaxId(budgetId, modal.taxId.trim());
          }
          await updateClientAddress(budgetId, {
            address_street: modal.addressStreet,
            address_postal_code: modal.addressPostalCode,
            address_city: modal.addressCity,
          });
          const { invoiceId } = await createInvoiceFromBudget(
            budgetId,
            pricingMode,
            modal.issueDate,
            modal.dueDate
          );
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
          {isApproved ? (
            <>
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
                disabled={isInvoicing}
                aria-busy={isInvoicing || undefined}
                aria-label="Generar factura"
                title="Generar factura"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  modal.openModal();
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
            </>
          ) : (
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
          )}
          {!isApproved ? (
            <div
              ref={pdfMenuRef}
              className={styles.dropdown}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Escape") setPdfMenuOpen(false);
              }}
            >
              <button
                type="button"
                disabled={generating}
                className={
                  variant === "icons"
                    ? styles.iconBtn
                    : `${styles.btn} ${styles.primary}`
                }
                aria-busy={generating || undefined}
                aria-haspopup="menu"
                aria-expanded={pdfMenuOpen}
                onClick={(e) => {
                  e.preventDefault();
                  setPdfMenuOpen((v) => !v);
                }}
                title="PDF"
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
                  <>
                    PDF <ChevronDown size={16} aria-hidden="true" />
                  </>
                )}
              </button>

              {pdfMenuOpen ? (
                <div className={styles.dropdownMenu} role="menu">
                  <button
                    type="button"
                    className={styles.menuItem}
                    role="menuitem"
                    disabled={generating}
                    onClick={(e) => handleGeneratePdfLang(e, "ca")}
                  >
                    Català <span className={styles.menuHint}>PDF</span>
                  </button>
                  <button
                    type="button"
                    className={styles.menuItem}
                    role="menuitem"
                    disabled={generating}
                    onClick={(e) => handleGeneratePdfLang(e, "es")}
                  >
                    Castellano <span className={styles.menuHint}>PDF</span>
                  </button>
                </div>
              ) : null}
            </div>
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

      {!isInvoiced && modal.open ? (
        <InvoiceModal
          loading={isInvoicing}
          clientName={clientName}
          clientTaxId={clientTaxId}
          taxId={modal.taxId}
          setTaxId={modal.setTaxId}
          issueDate={modal.issueDate}
          setIssueDate={modal.setIssueDate}
          dueDate={modal.dueDate}
          setDueDate={modal.setDueDate}
          step={modal.step}
          selectedPricingMode={modal.selectedPricingMode}
          onSelectPricing={modal.selectPricing}
          onConfirm={() => {
            if (modal.selectedPricingMode)
              handleCreateInvoice(modal.selectedPricingMode);
          }}
          onBack={modal.goBack}
          onClose={modal.closeModal}
          addressStreet={modal.addressStreet}
          setAddressStreet={modal.setAddressStreet}
          addressPostalCode={modal.addressPostalCode}
          setAddressPostalCode={modal.setAddressPostalCode}
          addressCity={modal.addressCity}
          setAddressCity={modal.setAddressCity}
          clientDataLoading={modal.clientDataLoading}
        />
      ) : null}

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
