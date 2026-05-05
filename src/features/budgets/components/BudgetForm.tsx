"use client";

import { BudgetAIInput } from "@/features/budgets/components/BudgetAIInput";

interface Props {
  loading: boolean;
  formError: string | null;
  pricePerSqm: number;
  onPriceChange: (value: number) => void;
  onSubmit: (description: string) => Promise<boolean>;
}

export function BudgetForm({
  loading,
  formError,
  pricePerSqm,
  onPriceChange,
  onSubmit,
}: Props) {
  return (
    <BudgetAIInput
      loading={loading}
      formError={formError}
      onSubmit={onSubmit}
      placeholder="Escriu una partida i afegeix-la al pressupost…"
      showPricePerSqm
      pricePerSqm={pricePerSqm}
      onPriceChange={onPriceChange}
    />
  );
}
