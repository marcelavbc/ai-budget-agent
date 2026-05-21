"use client";

import { useEffect, useRef, useState } from "react";

const DECIMAL_DRAFT_RE = /^\d*([.,]\d*)?$/;

function parseDecimalDraft(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  if (normalized === "" || normalized === ".") return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function formatDecimal(value: number): string {
  return Number.isFinite(value) ? String(value) : "";
}

interface Props
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "type" | "inputMode"
  > {
  value: number;
  onChange: (value: number) => void;
}

export function DecimalFieldInput({
  value,
  onChange,
  onBlur,
  onFocus,
  ...rest
}: Props) {
  const [draft, setDraft] = useState(() => formatDecimal(value));
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!focusedRef.current) {
      setDraft(formatDecimal(value));
    }
  }, [value]);

  function commit(next: number) {
    onChange(next);
    setDraft(formatDecimal(next));
  }

  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      value={draft}
      onFocus={(e) => {
        focusedRef.current = true;
        onFocus?.(e);
      }}
      onBlur={(e) => {
        focusedRef.current = false;
        const parsed = parseDecimalDraft(draft);
        commit(parsed ?? 0);
        onBlur?.(e);
      }}
      onChange={(e) => {
        const next = e.target.value;
        if (!DECIMAL_DRAFT_RE.test(next)) return;
        setDraft(next);
        const parsed = parseDecimalDraft(next);
        if (parsed !== null) {
          onChange(parsed);
        }
      }}
    />
  );
}
