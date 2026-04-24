"use client";

import { useState } from "react";
import type { BudgetStatus } from "@/lib/budgets";
import { updateBudgetById } from "@/lib/budgets";
import styles from "./page.module.css";

function normalizeStatus(value: string | null | undefined): BudgetStatus {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "sent") return "sent";
  if (v === "approved") return "approved";
  return "draft";
}

function nextStatus(value: BudgetStatus): BudgetStatus {
  if (value === "draft") return "sent";
  if (value === "sent") return "approved";
  return "draft";
}

function statusLabel(value: BudgetStatus): string {
  if (value === "draft") return "Esborrany";
  if (value === "sent") return "Enviat";
  return "Aprovat";
}

function pillClass(value: BudgetStatus): string {
  if (value === "sent") return styles.pillSent;
  if (value === "approved") return styles.pillApproved;
  return styles.pillDraft;
}

export function StatusPill({
  budgetId,
  initialStatus,
}: {
  budgetId: string;
  initialStatus: string | null;
}) {
  const [status, setStatus] = useState<BudgetStatus>(normalizeStatus(initialStatus));
  const [saving, setSaving] = useState(false);

  async function handleClick() {
    if (saving) return;
    const prev = status;
    const next = nextStatus(prev);
    setStatus(next);
    setSaving(true);
    try {
      await updateBudgetById(budgetId, { status: next });
    } catch {
      setStatus(prev);
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
      {statusLabel(status)}
    </button>
  );
}

