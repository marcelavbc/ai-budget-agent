export type BudgetsListPeriodKey =
  | "thisMonth"
  | "last3Months"
  | "thisYear"
  | "all"
  | "custom";

export function budgetsListPeriodLabel(key: BudgetsListPeriodKey) {
  if (key === "thisMonth") return "Aquest mes";
  if (key === "last3Months") return "Últims 3 mesos";
  if (key === "thisYear") return "Aquest any";
  if (key === "all") return "Tot el període";
  return "Personalitzat";
}

