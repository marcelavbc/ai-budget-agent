"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { BudgetListRow } from "@/features/budgets/types/budgetsDb";
import { BudgetsView } from "@/features/budgets/components/BudgetsView";
import styles from "@/app/budgets/page.module.css";

export function BudgetsListSection({ budgets }: { budgets: BudgetListRow[] }) {
  const newId = useSearchParams().get("new")?.trim();

  if (budgets.length === 0 && !newId) {
    return (
      <section className={styles.empty}>
        <h2 className={styles.emptyTitle}>
          Encara no hi ha pressupostos. Crea el primer!
        </h2>
      </section>
    );
  }

  return (
    <div className={styles.viewMount}>
      <BudgetsView budgets={budgets} />
    </div>
  );
}

export function BudgetsListCta() {
  return (
    <div className={styles.actions}>
      <Link className={styles.cta} href="/budgets/nou">
        Nou pressupost
      </Link>
    </div>
  );
}
