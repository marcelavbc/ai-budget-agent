"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "./FilterBar.module.css";

const monthLabels = [
  { n: 1, label: "Gen" },
  { n: 2, label: "Feb" },
  { n: 3, label: "Mar" },
  { n: 4, label: "Abr" },
  { n: 5, label: "Mai" },
  { n: 6, label: "Jun" },
  { n: 7, label: "Jul" },
  { n: 8, label: "Ago" },
  { n: 9, label: "Set" },
  { n: 10, label: "Oct" },
  { n: 11, label: "Nov" },
  { n: 12, label: "Des" },
] as const;

function parseIntSafe(v: string | null): number | null {
  if (!v) return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const lastClickedMonthRef = useRef<number | null>(null);

  const nowYear = new Date().getFullYear();
  const paramYear = parseIntSafe(searchParams.get("year"));
  const activeYear = Math.min(paramYear ?? nowYear, nowYear);

  const selectedMonths = useMemo(() => {
    const raw = searchParams.getAll("month");
    const nums = raw
      .map((v) => parseIntSafe(v))
      .filter((n): n is number => typeof n === "number")
      .filter((n) => n >= 1 && n <= 12);
    return new Set(nums);
  }, [searchParams]);

  const [open, setOpen] = useState(false);

  function push(next: URLSearchParams) {
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function setYear(nextYear: number) {
    const clamped = Math.min(nextYear, nowYear);
    const next = new URLSearchParams(searchParams.toString());
    next.set("year", String(clamped));
    push(next);
  }

  function setMonths(nextSelected: Set<number>) {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("month");

    const months = [...nextSelected].sort((a, b) => a - b);
    for (const m of months) next.append("month", String(m));

    if (months.length > 0 && !next.get("year")) next.set("year", String(nowYear));
    push(next);
  }

  function clearMonths() {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("month");
    push(next);
  }

  function toggleMonth(month: number, opts?: { shiftKey?: boolean }) {
    const next = new Set(selectedMonths);
    const shiftKey = Boolean(opts?.shiftKey);
    const last = lastClickedMonthRef.current;

    if (shiftKey && typeof last === "number") {
      const start = Math.min(last, month);
      const end = Math.max(last, month);
      for (let m = start; m <= end; m += 1) next.add(m);
    } else {
      if (next.has(month)) next.delete(month);
      else next.add(month);
    }

    lastClickedMonthRef.current = month;
    setMonths(next);
  }

  const monthTriggerLabel = useMemo(() => {
    if (selectedMonths.size === 0) return "Tots els mesos";
    const selected = monthLabels
      .filter((m) => selectedMonths.has(m.n))
      .map((m) => m.label);
    return selected.join(", ");
  }, [selectedMonths]);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      const root = rootRef.current;
      if (!root) return;
      if (e.target instanceof Node && root.contains(e.target)) return;
      setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.wrap} aria-label="Filtres de data" ref={rootRef}>
      <div className={styles.control} aria-label="Any">
        <button
          type="button"
          className={styles.controlButton}
          onClick={() => setYear(activeYear - 1)}
          aria-label="Any anterior"
        >
          ←
        </button>
        <span className={styles.controlLabel}>{activeYear}</span>
        <button
          type="button"
          className={styles.controlButton}
          onClick={() => setYear(activeYear + 1)}
          aria-label="Any següent"
          disabled={activeYear >= nowYear}
        >
          →
        </button>
      </div>

      <div className={styles.monthWrap}>
        <button
          type="button"
          className={styles.monthTrigger}
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span>{monthTriggerLabel}</span>
          {selectedMonths.size > 0 ? (
            <span className={styles.monthBadge} aria-label="Mesos seleccionats">
              {selectedMonths.size}
            </span>
          ) : null}
        </button>

        {open ? (
          <div className={styles.popover} role="dialog" aria-label="Mesos">
            <div className={styles.monthGrid}>
              {monthLabels.map((m) => {
                const active = selectedMonths.has(m.n);
                return (
                  <button
                    key={m.n}
                    type="button"
                    className={`${styles.monthPill} ${
                      active ? styles.monthPillActive : ""
                    }`}
                    aria-pressed={active}
                    onClick={(e) => toggleMonth(m.n, { shiftKey: e.shiftKey })}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
            <div className={styles.popoverFooter}>
              <button
                type="button"
                className={styles.clearButton}
                onClick={() => clearMonths()}
              >
                Netejar
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

