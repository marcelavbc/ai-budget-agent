"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import type { BudgetListRow } from "@/features/budgets/types/budgetsDb";
import { budgetStatusOrAllLabel, type BudgetStatus } from "@/features/budgets/lib/budgetStatus";
import { filterBudgets } from "@/features/budgets/lib/filterBudgets";
import {
  budgetsListPeriodLabel,
  type BudgetsListPeriodKey,
} from "@/features/budgets/lib/budgetsListPeriod";
import { addMonths, startOfMonth, startOfYear, toYMD } from "@/shared/lib/dateUtils";

const statusLabel = budgetStatusOrAllLabel;

export function useBudgetsListFilters(items: BudgetListRow[]) {
  const [query, setQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<Set<BudgetStatus>>(
    () => new Set()
  );
  const [period, setPeriod] = useState<BudgetsListPeriodKey>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [openMenu, setOpenMenu] = useState<"status" | "period" | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const menusRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onPointerDown(e: MouseEvent | PointerEvent) {
      const el = menusRef.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      setOpenMenu(null);
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    const now = new Date();
    if (period === "thisMonth") {
      setDateFrom(toYMD(startOfMonth(now)));
      setDateTo(toYMD(now));
      return;
    }
    if (period === "last3Months") {
      setDateFrom(toYMD(addMonths(now, -3)));
      setDateTo(toYMD(now));
      return;
    }
    if (period === "thisYear") {
      setDateFrom(toYMD(startOfYear(now)));
      setDateTo(toYMD(now));
      return;
    }
    if (period === "all") {
      setDateFrom("");
      setDateTo("");
      return;
    }
    // custom: preserve typed values
  }, [period]);

  const filtered = useMemo(
    () =>
      filterBudgets(items, {
        query,
        selectedStatuses,
        dateFrom,
        dateTo,
      }),
    [items, query, selectedStatuses, dateFrom, dateTo]
  );

  const customHasDates =
    period === "custom" && (dateFrom.trim() !== "" || dateTo.trim() !== "");
  const hasPeriodFilter = period !== "all" && (period !== "custom" || customHasDates);
  const hasFilters = query.trim() !== "" || selectedStatuses.size > 0 || hasPeriodFilter;

  const activeFilterCount = selectedStatuses.size + (hasPeriodFilter ? 1 : 0);
  const resultsLabel = `${filtered.length} de ${items.length}`;

  function reset() {
    setQuery("");
    setSelectedStatuses(new Set());
    setPeriod("all");
    setDateFrom("");
    setDateTo("");
    setFiltersOpen(false);
    setOpenMenu(null);
  }

  function toggleStatus(value: BudgetStatus) {
    setSelectedStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  const searchInputProps = {
    value: query,
    onChange: (e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value),
    placeholder: "Cerca per nom, número o adreça..." as const,
    inputMode: "search" as const,
    autoComplete: "off" as const,
    "aria-label": "Cerca per nom, número o adreça",
  };

  const statusIsActive = selectedStatuses.size > 0;
  const periodIsActive = period !== "all";

  return {
    filtered,

    // menu root
    menusRef,

    // filters UI state
    filtersOpen,
    setFiltersOpen,
    openMenu,
    setOpenMenu,

    // filter values
    selectedStatuses,
    toggleStatus,
    period,
    setPeriod,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    searchInputProps,

    // derived
    statusIsActive,
    periodIsActive,
    hasFilters,
    activeFilterCount,
    resultsLabel,

    // labels
    statusLabel,
    periodLabel: budgetsListPeriodLabel,

    // actions
    reset,
  };
}

export type BudgetsListFilters = ReturnType<typeof useBudgetsListFilters>;
