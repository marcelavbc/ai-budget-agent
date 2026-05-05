"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileDown, Pencil, Percent, Receipt, Trash2, ChevronDown } from "lucide-react";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import styles from "./BudgetListItemActions.module.css";
import { usePdfExport } from "@/features/budgets/hooks/usePdfExport";
import type { BudgetClientDetails, BudgetClientItem } from "@/features/budgets/types/budget";
import type { BudgetLineRow, BudgetRow, ClientRow } from "@/features/budgets/types/budgetsDb";
import { deleteBudgetWithLines, getBudgetExportData } from "@/features/budgets/lib/budgetsClient";
import { createInvoiceFromBudget } from "@/features/invoices/lib/invoicesClient";
import { normalizeBudgetStatus } from "@/features/budgets/lib/budgetStatus";
import type { InvoicePricingMode } from "@/features/invoices/types/invoice";

export function BudgetListItemActions({
  budgetId,
  budgetStatus,
  invoices,
  onInvoiceCreated,
  variant = "full",
}: {
  budgetId: string;
  budgetStatus?: string | null;
  invoices?: { withoutIva: string | null; withIva: string | null };
  onInvoiceCreated?: (pricingMode: InvoicePricingMode, invoiceId: string) => void;
  variant?: "full" | "icons";
}) {
  const { exportPdf, generating, pdfError, setPdfError } = usePdfExport();
  const [pdfMenuOpen, setPdfMenuOpen] = useState(false);
  const pdfMenuRef = useRef<HTMLDivElement | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [isInvoicing, startInvoicing] = useTransition();
  const [invoicePricingBusy, setInvoicePricingBusy] =
    useState<InvoicePricingMode | null>(null);
  const router = useRouter();

  const isApproved = normalizeBudgetStatus(budgetStatus) === "approved";
  const inv = invoices ?? { withoutIva: null, withIva: null };

  useEffect(() => {
    if (!pdfMenuOpen) return;

    function onPointerDown(e: PointerEvent) {
      const root = pdfMenuRef.current;
      if (!root) return;
      if (e.target instanceof Node && root.contains(e.target)) return;
      setPdfMenuOpen(false);
    }

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [pdfMenuOpen]);

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
      const budget = (data as { budget?: unknown }).budget as BudgetRow | undefined;
      const client = (data as { client?: unknown }).client as ClientRow | undefined;
      const lines = (data as { lines?: unknown }).lines as BudgetLineRow[] | undefined;
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
        address: (budget.job_address ?? client.address ?? "").trim(),
        quoteNumber: (budget.quote_number ?? "").trim(),
        date: (budget.document_date ?? "").trim(),
        estimatedTime: (budget.estimated_time ?? "").trim(),
      };

      await exportPdf({
        client: clientForPdf,
        items: itemsForPdf,
        lang,
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
    try {
      await deleteBudgetWithLines(budgetId);
      router.refresh();
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  function startCreateInvoice(pricingMode: InvoicePricingMode) {
    if (isInvoicing || invoicePricingBusy) return;
    setInvoiceError(null);
    setInvoicePricingBusy(pricingMode);
    startInvoicing(() => {
      void (async () => {
        try {
          const { invoiceId: createdId } = await createInvoiceFromBudget(
            budgetId,
            pricingMode
          );
          onInvoiceCreated?.(pricingMode, createdId);
          router.push(`/invoices/${createdId}`);
          router.refresh();
        } catch (err) {
          setInvoiceError(
            err instanceof Error
              ? err.message
              : "No s'ha pogut generar la factura."
          );
        } finally {
          setInvoicePricingBusy(null);
        }
      })();
    });
  }

  function renderInvoiceControl(pricingMode: InvoicePricingMode) {
    const id =
      pricingMode === "without_iva" ? inv.withoutIva : inv.withIva;
    const resolved = id?.trim() ? id : null;
    const busy = invoicePricingBusy === pricingMode;
    const Icon = pricingMode === "without_iva" ? Receipt : Percent;
    const shortTitle =
      pricingMode === "without_iva" ? "Sense IVA" : "Amb IVA";

    if (resolved) {
      return (
        <Link
          key={pricingMode}
          href={`/invoices/${resolved}`}
          onClick={(e) => e.stopPropagation()}
          className={variant === "icons" ? styles.iconBtn : styles.btn}
          aria-label={`Veure factura ${shortTitle}`}
          title={`Veure factura (${shortTitle})`}
        >
          {variant === "icons" ? (
            <Icon size={18} aria-hidden="true" />
          ) : (
            `Veure · ${shortTitle}`
          )}
        </Link>
      );
    }

    return (
      <button
        key={pricingMode}
        type="button"
        className={variant === "icons" ? styles.iconBtn : styles.btn}
        disabled={busy || isInvoicing}
        aria-busy={busy || undefined}
        aria-label={`Generar factura ${shortTitle}`}
        title={`Generar factura (${shortTitle})`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          startCreateInvoice(pricingMode);
        }}
      >
        {variant === "icons" ? (
          busy ? (
            "…"
          ) : (
            <Icon size={18} aria-hidden="true" />
          )
        ) : busy ? (
          "…"
        ) : (
          `Factura · ${shortTitle}`
        )}
      </button>
    );
  }

  return (
    <div className={`${styles.root} ${variant === "icons" ? styles.rootIcons : ""}`}>
      {isApproved ? (
        <div className={styles.invoicePair}>
          {renderInvoiceControl("without_iva")}
          {renderInvoiceControl("with_iva")}
        </div>
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

      {!isApproved && pdfError ? (
        <p className={styles.error} role="alert">
          {pdfError}
        </p>
      ) : null}
      {invoiceError ? (
        <p className={styles.error} role="alert">
          {invoiceError}
        </p>
      ) : null}
    </div>
  );
}
