"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateBudgetById } from "@/features/budgets/lib/budgetsClient";
import {
  budgetStatusLabel,
  normalizeBudgetStatus,
  type BudgetStatus,
} from "@/features/budgets/lib/budgetStatus";
import styles from "@/app/budgets/page.module.css";

function nextStatus(value: BudgetStatus): BudgetStatus {
  if (value === "draft") return "sent";
  if (value === "sent") return "approved";
  return "draft";
}

function pillClass(value: BudgetStatus): string {
  if (value === "sent") return styles.pillSent;
  if (value === "approved") return styles.pillApproved;
  return styles.pillDraft;
}

export function StatusPill({
  budgetId,
  initialStatus,
  onStatusChange,
}: {
  budgetId: string;
  initialStatus: string | null;
  onStatusChange?: (next: BudgetStatus) => void;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<BudgetStatus>(
    normalizeBudgetStatus(initialStatus)
  );
  const [saving, setSaving] = useState(false);

  async function handleClick() {
    if (saving) return;
    const prev = status;
    const next = nextStatus(prev);
    setStatus(next);
    onStatusChange?.(next);
    setSaving(true);
    try {
      await updateBudgetById(budgetId, { status: next });
      router.refresh();
    } catch {
      setStatus(prev);
      onStatusChange?.(prev);
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      className={`${styles.pill} ${pillClass(status)} ${styles.pillButton}`}
      onClick={handleClick}
      disabled={saving}
      title="Clica per canviar l’estat"
      aria-label="Canviar estat del pressupost"
    >
      {budgetStatusLabel(status)}
    </button>
  );
}

