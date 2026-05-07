import { BudgetEditView } from "@/features/budgets/components/BudgetEditView";
import {
  getBudgetById,
  getBudgetLinesByBudgetId,
  getClientById,
} from "@/features/budgets/lib/budgets";
import { notFound } from "next/navigation";

import styles from "./page.module.css";

export default async function BudgetEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const budget = await getBudgetById(id);
  if (!budget) notFound();
  const [client, lines] = await Promise.all([
    getClientById(budget.client_id),
    getBudgetLinesByBudgetId(budget.id),
  ]);

  return (
    <main className={styles.main}>
      <BudgetEditView
        budget={budget}
        client={client}
        lines={lines}
      />
    </main>
  );
}

