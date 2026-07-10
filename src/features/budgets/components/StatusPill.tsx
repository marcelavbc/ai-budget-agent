"use client";

import {
  budgetStatusLabel,
  normalizeBudgetStatus,
  type BudgetStatus,
} from "@/features/budgets/lib/budgetStatus";
import styles from "./BudgetsView.module.css";

function pillClass(value: BudgetStatus): string {
  if (value === "invoiced") return styles.pillInvoiced;
  return styles.pillDraft;
}

export function StatusPill({
  initialStatus,
}: {
  budgetId?: string;
  initialStatus: string | null;
  onStatusChange?: (next: BudgetStatus) => void;
}) {
  const status = normalizeBudgetStatus(initialStatus);

  return (
    <span className={`${styles.pill} ${pillClass(status)}`}>
      {budgetStatusLabel(status)}
    </span>
  );
}
