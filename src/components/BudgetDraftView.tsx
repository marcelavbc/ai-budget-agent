"use client";

import { useState } from "react";
import type { BudgetClientItem } from "@/types/budget";
import { formatEUR } from "@/lib/formatCurrency";
import styles from "./BudgetDraftView.module.css";

interface Props {
  items: BudgetClientItem[];
  onBack: () => void;
}

export function BudgetDraftView({ items, onBack }: Props) {
  const [descriptions, setDescriptions] = useState<Record<string, string>>(() =>
    Object.fromEntries(items.map((item) => [item.id, item.description]))
  );

  const total = items.reduce((sum, item) => sum + item.total, 0);

  function handleDescriptionChange(id: string, value: string) {
    setDescriptions((prev) => ({ ...prev, [id]: value }));
  }

  return (
    <section className={styles.root}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={onBack}>
          ← Tornar a les línies
        </button>
        <h2 className={styles.heading}>Esborrany del pressupost</h2>
      </div>

      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>{item.title}</span>
              <span className={styles.cardTotal}>{formatEUR(item.total)}</span>
            </div>
            <textarea
              className={styles.descTextarea}
              value={descriptions[item.id]}
              onChange={(e) => handleDescriptionChange(item.id, e.target.value)}
              rows={4}
              placeholder="Descripció de la partida…"
            />
          </li>
        ))}
      </ul>

      <div className={styles.footer}>
        <span className={styles.totalLabel}>Total pressupost</span>
        <span className={styles.totalValue}>{formatEUR(total)}</span>
      </div>
    </section>
  );
}
