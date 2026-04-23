import { BudgetEditView } from "@/components/BudgetEditView";
import {
  getBudgetById,
  getBudgetLinesByBudgetId,
  getClientById,
} from "@/lib/budgets";

export default async function BudgetEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const budget = await getBudgetById(id);
  const [client, lines] = await Promise.all([
    getClientById(budget.client_id),
    getBudgetLinesByBudgetId(budget.id),
  ]);

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 1.25rem" }}>
      <BudgetEditView budget={budget} client={client} lines={lines} />
    </main>
  );
}

