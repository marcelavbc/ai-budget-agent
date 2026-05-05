"use client";

import { useState } from "react";
import styles from "./BudgetForm.module.css";

interface Props {
  loading: boolean;
  formError: string | null;
  onSubmit: (description: string) => Promise<boolean>;
  placeholder?: string;
  submitLabel?: string;
  showPricePerSqm?: boolean;
  pricePerSqm?: number;
  onPriceChange?: (value: number) => void;
}

export function BudgetAIInput({
  loading,
  formError,
  onSubmit,
  placeholder = "Ex.: Pintar menjador de 20 m² en blanc",
  submitLabel = "Afegir partida",
  showPricePerSqm = false,
  pricePerSqm,
  onPriceChange,
}: Props) {
  const [description, setDescription] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const displayError = validationError ?? formError;

  async function submitTrimmed(trimmed: string) {
    setValidationError(null);
    const ok = await onSubmit(trimmed);
    if (ok) setDescription("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = description.trim();
    if (!trimmed) {
      setValidationError("Escriu una descripció del treball.");
      return;
    }
    await submitTrimmed(trimmed);
  }

  async function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter" || e.shiftKey) return;
    e.preventDefault();
    const trimmed = description.trim();
    if (!trimmed) {
      setValidationError("Escriu una descripció del treball.");
      return;
    }
    await submitTrimmed(trimmed);
  }

  const showSlider =
    showPricePerSqm && typeof pricePerSqm === "number" && !!onPriceChange;

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={showSlider ? styles.inputRow : styles.inputStack}>
        <div className={styles.textareaColumn}>
          <textarea
            id="job-description"
            className={styles.textarea}
            name="description"
            value={description}
            disabled={loading}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={placeholder}
            aria-label="Descripció del treball"
            autoComplete="off"
            spellCheck
            onKeyDown={handleKeyDown}
            rows={4}
          />

          <button className={styles.submit} type="submit" disabled={loading}>
            {loading ? "Afegint…" : submitLabel}
          </button>
        </div>

        {showSlider ? (
          <div className={styles.priceBlock}>
            <div className={styles.priceRow}>
              <label className={styles.sliderLabel} htmlFor="price-per-sqm">
                Preu orientatiu per m²
              </label>
              <span className={styles.sliderValue}>{pricePerSqm} €</span>
            </div>

            <input
              id="price-per-sqm"
              className={styles.slider}
              type="range"
              min={6}
              max={20}
              step={1}
              value={pricePerSqm}
              onChange={(e) => onPriceChange(Number(e.target.value))}
              disabled={loading}
            />

            <p className={styles.sliderHint}>
              Valor aplicat a la pintura de parets i sostres.
            </p>
          </div>
        ) : null}
      </div>

      {displayError ? <p className={styles.formError}>{displayError}</p> : null}
    </form>
  );
}

