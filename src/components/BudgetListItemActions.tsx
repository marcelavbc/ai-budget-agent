"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { generateBudgetPdf } from "@/lib/generateBudgetPdf";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import styles from "./BudgetListItemActions.module.css";
import {
  deleteBudgetWithLines,
  getBudgetById,
  getBudgetLinesByBudgetId,
  getClientById,
} from "@/lib/budgets";
import type { BudgetClientDetails, BudgetClientItem } from "@/types/budget";

export function BudgetListItemActions({ budgetId }: { budgetId: string }) {
  const [generating, setGenerating] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const router = useRouter();

  async function handleGeneratePdf(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (generating) return;
    setGenerating(true);
    setPdfError(null);
    try {
      const budget = await getBudgetById(budgetId);
      if (!budget) throw new Error("No s'ha trobat el pressupost.");
      const [client, lines] = await Promise.all([
        getClientById(budget.client_id),
        getBudgetLinesByBudgetId(budget.id),
      ]);

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

      const blob = await generateBudgetPdf({
        client: clientForPdf,
        items: itemsForPdf,
        total: budget.total ?? budget.subtotal ?? 0,
      });

      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (e) {
      setPdfError(
        e instanceof Error
          ? e.message
          : "No s'ha pogut generar el PDF. Torna-ho a provar."
      );
    } finally {
      setGenerating(false);
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
    <div className={styles.root}>
      <Link
        href={`/budgets/${budgetId}/edit`}
        onClick={(e) => e.stopPropagation()}
        className={styles.btn}
      >
        Editar
      </Link>
      <button
        type="button"
        onClick={handleGeneratePdf}
        disabled={generating}
        className={`${styles.btn} ${styles.primary}`}
        aria-busy={generating || undefined}
      >
        {generating ? "PDF…" : "PDF"}
      </button>

      <button
        type="button"
        onClick={handleDeleteClick}
        disabled={deleting}
        className={`${styles.btn} ${styles.danger}`}
        aria-label="Eliminar pressupost"
      >
        {deleting ? "…" : "Eliminar"}
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

