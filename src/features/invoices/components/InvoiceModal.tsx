"use client";

import { useEffect, useRef, useId, useState } from "react";
import dialogStyles from "@/shared/components/ConfirmDialog.module.css";
import { useFocusTrap } from "@/shared/hooks/useFocusTrap";
import type { InvoicePricingMode } from "@/features/invoices/types/invoice";
import type { InvoiceModalStep } from "@/features/invoices/hooks/useInvoiceModal";

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
  addressStreet: string;
  setAddressStreet: (v: string) => void;
  addressPostalCode: string;
  setAddressPostalCode: (v: string) => void;
  addressCity: string;
  setAddressCity: (v: string) => void;
  clientDataLoading: boolean;
  step: InvoiceModalStep;
  selectedPricingMode: InvoicePricingMode | null;
  taxRate: number;
  setTaxRate: (v: number) => void;
  onSelectPricing: (mode: InvoicePricingMode) => void;
  onConfirmTaxRate: () => void;
  onConfirm: () => void;
  onBack: () => void;
  onClose: () => void;
};

type TaxRateOption = 21 | 10 | "other";

function taxRateOptionFromValue(rate: number): TaxRateOption {
  if (rate === 21) return 21;
  if (rate === 10) return 10;
  return "other";
}

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
  addressStreet,
  setAddressStreet,
  addressPostalCode,
  setAddressPostalCode,
  addressCity,
  setAddressCity,
  clientDataLoading,
  step,
  selectedPricingMode,
  taxRate,
  setTaxRate,
  onSelectPricing,
  onConfirmTaxRate,
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
  const [taxRateOption, setTaxRateOption] = useState<TaxRateOption>(() =>
    taxRateOptionFromValue(taxRate)
  );

  useEffect(() => {
    if (step === 1.5) {
      setTaxRateOption(taxRateOptionFromValue(taxRate));
    }
  }, [step, taxRate]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (step === 1 || step === 1.5) firstActionRef.current?.focus();
      else taxIdInputRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [step]);

  useFocusTrap(dialogRef, true, onClose);

  const stepDescription =
    step === 1
      ? "Selecciona el tipus de factura"
      : step === 1.5
        ? "Selecciona el tipus d'IVA"
        : "Completa les dades fiscals i les dates de la factura.";

  const customTaxRateValid =
    taxRateOption !== "other" || (taxRate > 0 && taxRate <= 100);
  console.log("taxRateOption:", taxRateOption, typeof taxRateOption);

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
          {stepDescription}
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
        ) : step === 1.5 ? (
          <div className={dialogStyles.form}>
            <div
              className={dialogStyles.fields}
              role="group"
              aria-label="Tipus d'IVA"
            >
              <div
                className={dialogStyles.actions}
                style={{ flexWrap: "wrap", marginTop: 0 }}
              >
                <button
                  ref={firstActionRef}
                  type="button"
                  className={`${dialogStyles.btn} ${taxRateOption === 21 ? dialogStyles.btnActive : ""}`}
                  aria-pressed={taxRateOption === 21}
                  onClick={() => {
                    setTaxRateOption(21);
                    setTaxRate(21);
                  }}
                  disabled={loading}
                >
                  21%
                </button>
                <button
                  type="button"
                  className={`${dialogStyles.btn} ${taxRateOption === 10 ? dialogStyles.btnActive : ""}`}
                  aria-pressed={taxRateOption === 10}
                  onClick={() => {
                    setTaxRateOption(10);
                    setTaxRate(10);
                  }}
                  disabled={loading}
                >
                  10%
                </button>
                <button
                  type="button"
                  className={`${dialogStyles.btn} ${taxRateOption === "other" ? dialogStyles.btnActive : ""}`}
                  aria-pressed={taxRateOption === "other"}
                  onClick={() => setTaxRateOption("other")}
                  disabled={loading}
                >
                  Altre
                </button>
              </div>
              {taxRateOption === "other" ? (
                <label className={dialogStyles.field}>
                  <span
                    className={`${dialogStyles.body} ${dialogStyles.label}`}
                  >
                    Percentatge d&apos;IVA
                  </span>
                  <input
                    type="number"
                    min={0.01}
                    max={100}
                    step={0.01}
                    value={Number.isFinite(taxRate) ? taxRate : ""}
                    onChange={(e) => {
                      const parsed = parseFloat(e.target.value);
                      setTaxRate(Number.isFinite(parsed) ? parsed : 0);
                    }}
                    className={dialogStyles.input}
                    disabled={loading}
                  />
                </label>
              ) : null}
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
                type="button"
                className={dialogStyles.btn}
                onClick={onConfirmTaxRate}
                disabled={loading || !customTaxRateValid}
                aria-busy={loading || undefined}
              >
                Continuar
              </button>
            </div>
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
                  Carrer i número
                </span>
                <input
                  value={addressStreet}
                  onChange={(e) => setAddressStreet(e.target.value)}
                  className={dialogStyles.input}
                  disabled={clientDataLoading}
                />
              </label>
              <div className={dialogStyles.fieldRow}>
                <label className={dialogStyles.field}>
                  <span
                    className={`${dialogStyles.body} ${dialogStyles.label}`}
                  >
                    Codi postal
                  </span>
                  <input
                    value={addressPostalCode}
                    onChange={(e) => setAddressPostalCode(e.target.value)}
                    inputMode="numeric"
                    className={dialogStyles.input}
                    disabled={clientDataLoading}
                  />
                </label>
                <label className={dialogStyles.field}>
                  <span
                    className={`${dialogStyles.body} ${dialogStyles.label}`}
                  >
                    Població
                  </span>
                  <input
                    value={addressCity}
                    onChange={(e) => setAddressCity(e.target.value)}
                    className={dialogStyles.input}
                    disabled={clientDataLoading}
                  />
                </label>
              </div>
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
