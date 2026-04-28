"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileDown, Pencil, Trash2, ChevronDown } from "lucide-react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import styles from "./BudgetListItemActions.module.css";
import { usePdfExport } from "@/hooks/usePdfExport";
import type { BudgetClientDetails, BudgetClientItem } from "@/types/budget";
import type { BudgetLineRow, BudgetRow, ClientRow } from "@/types/budgetsDb";
import { deleteBudgetWithLines, getBudgetExportData } from "@/lib/budgetsClient";

export function BudgetListItemActions({
  budgetId,
  variant = "full",
}: {
  budgetId: string;
  variant?: "full" | "icons";
}) {
  const { exportPdf, generating, pdfError, setPdfError } = usePdfExport();
  const [pdfMenuOpen, setPdfMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const router = useRouter();

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
      }));

      const clientForPdf: BudgetClientDetails = {
        nameOrCompany: (client.name ?? "").trim(),
        email: (client.email ?? "").trim(),
        address: (budget.job_address ?? client.address ?? "").trim(),
        quoteNumber: (budget.quote_number ?? "").trim(),
        date: (budget.document_date ?? "").trim(),
        estimatedTime: (budget.estimated_time ?? "").trim(),
      };

      await exportPdf({
        client: clientForPdf,
        items: itemsForPdf,
        total: budget.total ?? budget.subtotal ?? 0,
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

  return (
    <div className={`${styles.root} ${variant === "icons" ? styles.rootIcons : ""}`}>
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
      <div
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

      {pdfError ? (
        <p className={styles.error} role="alert">
          {pdfError}
        </p>
      ) : null}
    </div>
  );
}

