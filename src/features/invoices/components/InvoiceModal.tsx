"use client";

import { useEffect, useRef, useId } from "react";
import dialogStyles from "@/shared/components/ConfirmDialog.module.css";
import { useFocusTrap } from "@/shared/hooks/useFocusTrap";
import type { InvoicePricingMode } from "@/features/invoices/types/invoice";

export type InvoiceModalProps = {
  loading: boolean;
  clientName?: string | null;
  clientTaxId?: string | null;
  taxId: string;
  setTaxId: (v: string) => void;
  issueDate: string;
  setIssueDate: (v: string) => void;
  dueDate: string;
  setDueDate: (v: string) => void;
  step: 1 | 2;
  selectedPricingMode: InvoicePricingMode | null;
  onSelectPricing: (mode: InvoicePricingMode) => void;
  onConfirm: () => void;
  onBack: () => void;
  onClose: () => void;
};

export function InvoiceModal({
  loading,
  clientName,
  clientTaxId,
  taxId,
  setTaxId,
  issueDate,
  setIssueDate,
  dueDate,
  setDueDate,
  step,
  selectedPricingMode,
  onSelectPricing,
  onConfirm,
  onBack,
  onClose,
}: InvoiceModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstActionRef = useRef<HTMLButtonElement | null>(null);
  const taxIdInputRef = useRef<HTMLInputElement | null>(null);
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const descId = `${baseId}-desc`;

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (step === 1) firstActionRef.current?.focus();
      else taxIdInputRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [step]);

  useFocusTrap(dialogRef, true, onClose);

  return (
    <div
      className={dialogStyles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={dialogStyles.dialog} ref={dialogRef} tabIndex={-1}>
        <h2 className={dialogStyles.title} id={titleId}>
          Generar factura
        </h2>
        <p className={dialogStyles.body} id={descId}>
          {step === 1
            ? "Selecciona el tipus de factura"
            : "Completa les dades fiscals i les dates de la factura."}
        </p>

        {step === 1 ? (
          <div className={dialogStyles.actions}>
            <button
              type="button"
              className={dialogStyles.btn}
              onClick={onClose}
              disabled={loading}
            >
              Cancel·lar
            </button>
            <button
              ref={firstActionRef}
              type="button"
              className={dialogStyles.btn}
              onClick={() => onSelectPricing("without_iva")}
              disabled={loading}
              aria-busy={loading || undefined}
            >
              {loading ? "…" : "Sense IVA"}
            </button>
            <button
              type="button"
              className={dialogStyles.btn}
              onClick={() => onSelectPricing("with_iva")}
              disabled={loading}
              aria-busy={loading || undefined}
            >
              {loading ? "…" : "Amb IVA"}
            </button>
          </div>
        ) : (
          <form
            className={dialogStyles.form}
            onSubmit={(e) => {
              e.preventDefault();
              onConfirm();
            }}
          >
            <div className={dialogStyles.fields}>
              <label className={dialogStyles.field}>
                <span className={`${dialogStyles.body} ${dialogStyles.label}`}>
                  Client
                </span>
                <input
                  value={clientName ?? ""}
                  readOnly
                  className={dialogStyles.input}
                />
              </label>
              <label className={dialogStyles.field}>
                <span className={`${dialogStyles.body} ${dialogStyles.label}`}>
                  NIF/NIE
                </span>
                <input
                  ref={taxIdInputRef}
                  value={taxId}
                  placeholder={
                    clientTaxId ? undefined : "Introdueix el NIF/NIE"
                  }
                  onChange={(e) => setTaxId(e.target.value)}
                  required
                  className={dialogStyles.input}
                />
              </label>
              <label className={dialogStyles.field}>
                <span className={`${dialogStyles.body} ${dialogStyles.label}`}>
                  Data d&apos;emissió
                </span>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className={dialogStyles.input}
                />
              </label>
              <label className={dialogStyles.field}>
                <span className={`${dialogStyles.body} ${dialogStyles.label}`}>
                  Venciment
                </span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={dialogStyles.input}
                />
              </label>
            </div>

            <div className={dialogStyles.actions}>
              <button
                type="button"
                className={dialogStyles.btn}
                onClick={onClose}
                disabled={loading}
              >
                Cancel·lar
              </button>
              <button
                type="button"
                className={dialogStyles.btn}
                onClick={onBack}
                disabled={loading}
              >
                Enrere
              </button>
              <button
                type="submit"
                className={dialogStyles.btn}
                disabled={loading || !selectedPricingMode || !taxId.trim()}
                aria-busy={loading || undefined}
              >
                {loading ? "…" : "Generar factura"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
