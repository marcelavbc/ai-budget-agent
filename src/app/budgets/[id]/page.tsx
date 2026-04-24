import { redirect } from "next/navigation";

export default async function BudgetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/budgets/${id}/edit`);
}

