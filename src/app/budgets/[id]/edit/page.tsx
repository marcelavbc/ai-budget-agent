import { BudgetEditView } from "@/features/budgets/components/BudgetEditView";
import {
  getBudgetById,
  getBudgetLinesByBudgetId,
  getClientById,
} from "@/features/budgets/lib/budgets";
import { getInvoicesForBudget } from "@/features/invoices/lib/invoices";
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
  const [client, lines, invoices] = await Promise.all([
    getClientById(budget.client_id),
    getBudgetLinesByBudgetId(budget.id),
    getInvoicesForBudget(budget.id),
  ]);

  return (
    <main className={styles.main}>
      <BudgetEditView
        budget={budget}
        client={client}
        lines={lines}
        invoiceWithoutIvaId={invoices.withoutIva}
        invoiceWithIvaId={invoices.withIva}
      />
    </main>
  );
}

