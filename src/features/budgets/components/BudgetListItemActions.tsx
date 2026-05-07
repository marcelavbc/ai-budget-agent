"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileDown, Pencil, Trash2, ChevronDown, Receipt } from "lucide-react";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import dialogStyles from "@/shared/components/ConfirmDialog.module.css";
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
  updateClientTaxId,
} from "@/features/invoices/lib/invoicesClient";
import { normalizeBudgetStatus } from "@/features/budgets/lib/budgetStatus";
import type { InvoicePricingMode } from "@/features/invoices/types/invoice";

export function BudgetListItemActions({
  budgetId,
  budgetStatus,
  clientName,
  clientTaxId,
  variant = "full",
}: {
  budgetId: string;
  budgetStatus?: string | null;
  clientName: string | null;
  clientTaxId: string | null;
  variant?: "full" | "icons";
}) {
  const { exportPdf, generating, pdfError, setPdfError } = usePdfExport();
  const [pdfMenuOpen, setPdfMenuOpen] = useState(false);
  const pdfMenuRef = useRef<HTMLDivElement | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [isInvoicing, startInvoicing] = useTransition();
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [invoiceStep, setInvoiceStep] = useState<1 | 2>(1);
  const [selectedPricingMode, setSelectedPricingMode] =
    useState<InvoicePricingMode | null>(null);
  const [taxId, setTaxId] = useState<string>(clientTaxId ?? "");
  const [issueDate, setIssueDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const router = useRouter();

  const isApproved = normalizeBudgetStatus(budgetStatus) === "approved";
  const isInvoiced = normalizeBudgetStatus(budgetStatus) === "invoiced";

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

  async function handleCreateInvoice(pricingMode: InvoicePricingMode) {
    setInvoiceModalOpen(false);
    setInvoiceError(null);
    startInvoicing(() => {
      void (async () => {
        try {
          // Guardar NIF al client si s'ha introduït
          if (taxId.trim() && taxId.trim() !== (clientTaxId ?? "").trim()) {
            await updateClientTaxId(budgetId, taxId.trim());
          }
          const { invoiceId } = await createInvoiceFromBudget(
            budgetId,
            pricingMode,
            issueDate,
            dueDate
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

  function handleCloseModal() {
    setInvoiceModalOpen(false);
    setInvoiceStep(1);
    setSelectedPricingMode(null);
    setTaxId(clientTaxId ?? "");
  }

  return (
    <div
      className={`${styles.root} ${variant === "icons" ? styles.rootIcons : ""}`}
    >
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
              setInvoiceModalOpen(true);
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
        disabled={deleting || isInvoiced}
        className={
          variant === "icons"
            ? `${styles.iconBtn} ${styles.iconBtnDanger}`
            : `${styles.btn} ${styles.danger}`
        }
        aria-label="Eliminar pressupost"
        title={
          isInvoiced ? "No es pot eliminar un pressupost facturat" : "Eliminar"
        }
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

      {invoiceModalOpen && (
        <InvoiceModal
          loading={isInvoicing}
          clientName={clientName}
          clientTaxId={clientTaxId}
          taxId={taxId}
          setTaxId={setTaxId}
          issueDate={issueDate}
          setIssueDate={setIssueDate}
          dueDate={dueDate}
          setDueDate={setDueDate}
          step={invoiceStep}
          selectedPricingMode={selectedPricingMode}
          onSelectPricing={(mode) => {
            setSelectedPricingMode(mode);
            setInvoiceStep(2);
          }}
          onConfirm={() => {
            if (selectedPricingMode) handleCreateInvoice(selectedPricingMode);
          }}
          onBack={() => setInvoiceStep(1)}
          onClose={handleCloseModal}
        />
      )}

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

function InvoiceModal({
  loading,
  clientName,
  clientTaxId,
  taxId,
  setTaxId,
  issueDate,
  setIssueDate,
  dueDate,
  setDueDate,
  step,
  selectedPricingMode,
  onSelectPricing,
  onConfirm,
  onBack,
  onClose,
}: {
  loading: boolean;
  clientName?: string | null;
  clientTaxId?: string | null;
  taxId: string;
  setTaxId: (v: string) => void;
  issueDate: string;
  setIssueDate: (v: string) => void;
  dueDate: string;
  setDueDate: (v: string) => void;
  step: 1 | 2;
  selectedPricingMode: InvoicePricingMode | null;
  onSelectPricing: (mode: InvoicePricingMode) => void;
  onConfirm: () => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstActionRef = useRef<HTMLButtonElement | null>(null);
  const taxIdInputRef = useRef<HTMLInputElement | null>(null);
  const titleId = useRef(`invoice-title-${crypto.randomUUID()}`);
  const descId = useRef(`invoice-desc-${crypto.randomUUID()}`);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (step === 1) firstActionRef.current?.focus();
      else taxIdInputRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [step]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const root = dialogRef.current;
        if (!root) return;
        const focusables = Array.from(
          root.querySelectorAll<HTMLElement>(
            'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
          )
        ).filter(
          (el) =>
            !el.hasAttribute("disabled") && !el.getAttribute("aria-disabled")
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (e.shiftKey) {
          if (active === first || active === root) {
            e.preventDefault();
            last.focus();
          }
        } else if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className={dialogStyles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId.current}
      aria-describedby={descId.current}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={dialogStyles.dialog} ref={dialogRef} tabIndex={-1}>
        <h2 className={dialogStyles.title} id={titleId.current}>
          Generar factura
        </h2>
        <p className={dialogStyles.body} id={descId.current}>
          {step === 1
            ? "Selecciona el tipus de factura"
            : "Completa les dades fiscals i les dates de la factura."}
        </p>

        {step === 1 ? (
          <div className={dialogStyles.actions}>
            <button
              type="button"
              className={dialogStyles.btn}
              onClick={onClose}
              disabled={loading}
            >
              Cancel·lar
            </button>
            <button
              ref={firstActionRef}
              type="button"
              className={dialogStyles.btn}
              onClick={() => onSelectPricing("without_iva")}
              disabled={loading}
              aria-busy={loading || undefined}
            >
              {loading ? "…" : "Sense IVA"}
            </button>
            <button
              type="button"
              className={dialogStyles.btn}
              onClick={() => onSelectPricing("with_iva")}
              disabled={loading}
              aria-busy={loading || undefined}
            >
              {loading ? "…" : "Amb IVA"}
            </button>
          </div>
        ) : (
          <form
            className={dialogStyles.form}
            onSubmit={(e) => {
              e.preventDefault();
              onConfirm();
            }}
          >
            <div className={dialogStyles.fields}>
              <label className={dialogStyles.field}>
                <span className={`${dialogStyles.body} ${dialogStyles.label}`}>
                  Client
                </span>
                <input
                  value={clientName ?? ""}
                  readOnly
                  className={dialogStyles.input}
                />
              </label>
              <label className={dialogStyles.field}>
                <span className={`${dialogStyles.body} ${dialogStyles.label}`}>
                  NIF/NIE
                </span>
                <input
                  ref={taxIdInputRef}
                  value={taxId}
                  placeholder={clientTaxId ? undefined : "Introdueix el NIF/NIE"}
                  onChange={(e) => setTaxId(e.target.value)}
                  required
                  className={dialogStyles.input}
                />
              </label>
              <label className={dialogStyles.field}>
                <span className={`${dialogStyles.body} ${dialogStyles.label}`}>
                  Data d&apos;emissió
                </span>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className={dialogStyles.input}
                />
              </label>
              <label className={dialogStyles.field}>
                <span className={`${dialogStyles.body} ${dialogStyles.label}`}>
                  Venciment
                </span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={dialogStyles.input}
                />
              </label>
            </div>

            <div className={dialogStyles.actions}>
              <button
                type="button"
                className={dialogStyles.btn}
                onClick={onClose}
                disabled={loading}
              >
                Cancel·lar
              </button>
              <button
                type="button"
                className={dialogStyles.btn}
                onClick={onBack}
                disabled={loading}
              >
                Enrere
              </button>
              <button
                type="submit"
                className={dialogStyles.btn}
                disabled={loading || !selectedPricingMode || !taxId.trim()}
                aria-busy={loading || undefined}
              >
                {loading ? "…" : "Generar factura"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
