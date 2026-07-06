"use client";

import { useEffect, useId, useRef } from "react";
import dialogStyles from "@/shared/components/ConfirmDialog.module.css";
import { useFocusTrap } from "@/shared/hooks/useFocusTrap";

export type InvoiceModalProps = {
  loading: boolean;
  clientName?: string | null;
  onConfirm: () => void;
  onClose: () => void;
};

export function InvoiceModal({
  loading,
  clientName,
  onConfirm,
  onClose,
}: InvoiceModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const descId = `${baseId}-desc`;

  useEffect(() => {
    const t = window.setTimeout(() => confirmRef.current?.focus(), 0);
    return () => window.clearTimeout(t);
  }, []);

  useFocusTrap(dialogRef, true, onClose);

  const normalizedClient = (clientName ?? "").trim();

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
          Confirmar facturacio
        </h2>
        <p className={dialogStyles.body} id={descId}>
          {normalizedClient
            ? `Es creara una factura per a ${normalizedClient}.`
            : "Es creara una factura per a aquest pressupost."}{" "}
          Aquesta accio es irreversible: el pressupost passara a estat facturat
          i ja no es podra editar.
        </p>

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
            ref={confirmRef}
            type="button"
            className={dialogStyles.btn}
            onClick={onConfirm}
            disabled={loading}
            aria-busy={loading || undefined}
          >
            {loading ? "…" : "Confirmar i facturar"}
          </button>
        </div>
      </div>
    </div>
  );
}
