"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BudgetClientDetails, BudgetClientItem } from "@/types/budget";
import { formatEUR } from "@/lib/formatCurrency";
import { isValidEmail } from "@/lib/isValidEmail";
import { isBudgetDraftComplete } from "@/lib/budgetDraft";
import { saveBudgetWithLines } from "@/lib/budgets";
import styles from "./BudgetDraftView.module.css";

interface Props {
  mode?: "create" | "edit";
  items: BudgetClientItem[];
  clientDetails: BudgetClientDetails;
  onClientDetailsChange: React.Dispatch<
    React.SetStateAction<BudgetClientDetails>
  >;
  onItemChange: (id: string, patch: Partial<BudgetClientItem>) => void;
  itemsFooter?: React.ReactNode;
  onSave?: (args: {
    client: BudgetClientDetails;
    items: BudgetClientItem[];
    subtotal: number;
  }) => Promise<void>;
  quoteManuallyEdited: boolean;
  onQuoteNumberChange: (value: string) => void;
  onResetQuoteAutomation: () => void;
  onBack: () => void;
}

export function BudgetDraftView({
  mode = "create",
  items,
  clientDetails: client,
  onClientDetailsChange: setClient,
  onItemChange,
  itemsFooter,
  onSave,
  quoteManuallyEdited,
  onQuoteNumberChange,
  onResetQuoteAutomation,
  onBack,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const router = useRouter();
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const emailInvalid = client.email.trim().length > 0 && !isValidEmail(client.email);
  const draftComplete = isBudgetDraftComplete({ client, items });

  function handleDescriptionChange(id: string, value: string) {
    onItemChange(id, { description: value });
  }

  async function handleSaveBudget() {
    if (!draftComplete || isSaving) return;
    setSaveError(null);
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave({ client, items, subtotal });
      } else {
        const { budgetId } = await saveBudgetWithLines({ client, items, subtotal });
        router.push(`/budgets/${budgetId}`);
      }
    } catch (e) {
      setSaveError(
        e instanceof Error
          ? e.message
          : "No s'ha pogut guardar el pressupost. Torna-ho a provar."
      );
    } finally {
      setIsSaving(false);
    }
  }

  function setClientField<K extends keyof BudgetClientDetails>(
    key: K,
    value: BudgetClientDetails[K],
  ) {
    setClient((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <section className={styles.root}>
      <div className={styles.topBar}>
        <button type="button" className={styles.backBtn} onClick={onBack}>
          ← Tornar a les línies
        </button>
        <h2 className={styles.heading}>
          {mode === "edit" ? "Editar pressupost" : "Esborrany del pressupost"}
        </h2>
      </div>

      <div className={styles.clientSection}>
        <h3 className={styles.clientSectionTitle}>
          Dades del client i del pressupost
        </h3>
        <div className={styles.fields}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Nom o empresa</span>
            <input
              className={styles.fieldInput}
              type="text"
              value={client.nameOrCompany}
              onChange={(e) =>
                setClientField("nameOrCompany", e.target.value)
              }
              autoComplete="organization"
              placeholder="Ex: Maria Vila / Pintures Puig"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Correu electrònic</span>
            <input
              className={`${styles.fieldInput} ${emailInvalid ? styles.fieldInputInvalid : ""}`}
              type="email"
              inputMode="email"
              value={client.email}
              onChange={(e) => setClientField("email", e.target.value)}
              autoComplete="email"
              placeholder="nom@exemple.cat"
              aria-invalid={emailInvalid}
            />
            {emailInvalid ? (
              <span className={styles.fieldError} role="alert">
                Revisa el format del correu (cal una adreça vàlida).
              </span>
            ) : null}
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Adreça</span>
            <textarea
              className={styles.fieldTextarea}
              rows={2}
              value={client.address}
              onChange={(e) => setClientField("address", e.target.value)}
              autoComplete="street-address"
              placeholder="Carrer, número, pis, codi postal, població"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Temps estimat</span>
            <textarea
              className={styles.fieldTextarea}
              rows={2}
              value={client.estimatedTime}
              onChange={(e) =>
                setClientField("estimatedTime", e.target.value)
              }
              placeholder="El temps estimat serà d’uns 7 a 9 dies hàbils."
            />
          </label>
          <div className={styles.fieldRow}>
            <div className={styles.quoteField}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Núm. de pressupost</span>
                <input
                  className={styles.fieldInput}
                  type="text"
                  value={client.quoteNumber}
                  onChange={(e) => onQuoteNumberChange(e.target.value)}
                  inputMode="text"
                  autoComplete="off"
                  aria-describedby="quote-hint"
                />
              </label>
              <p id="quote-hint" className={styles.fieldHint}>
                Es genera automàticament amb les inicials del nom o empresa i la
                data (p. ex. MV-20260415). Pots corregir-lo si cal.
              </p>
              {quoteManuallyEdited ? (
                <button
                  type="button"
                  className={styles.linkLike}
                  onClick={onResetQuoteAutomation}
                >
                  Tornar a generar automàticament
                </button>
              ) : null}
            </div>
            <label className={styles.field}>
              <span className={styles.fieldLabel}>Data</span>
              <input
                className={styles.fieldInput}
                type="date"
                value={client.date}
                onChange={(e) => setClientField("date", e.target.value)}
              />
            </label>
          </div>
        </div>
      </div>

      {mode === "edit" ? (
        <div className={styles.itemsTopBar}>
          <h3 className={styles.itemsTitle}>Partides</h3>
        </div>
      ) : null}

      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id} className={styles.card}>
            <div className={styles.cardHeader}>
              {mode === "edit" ? (
                <input
                  className={styles.itemTitleInput}
                  type="text"
                  value={item.title}
                  onChange={(e) => onItemChange(item.id, { title: e.target.value })}
                  placeholder="Títol de la partida"
                />
              ) : (
                <span className={styles.cardTitle}>{item.title}</span>
              )}
              <span className={styles.cardTotal}>{formatEUR(item.total)}</span>
            </div>

            {mode === "edit" ? (
              <div className={styles.itemMetaRow}>
                <label className={styles.itemField}>
                  <span className={styles.itemFieldLabel}>Quant.</span>
                  <input
                    className={styles.itemFieldInput}
                    type="number"
                    inputMode="decimal"
                    value={item.quantity ?? 1}
                    min={0}
                    step="0.01"
                    onChange={(e) => {
                      const q = Number(e.target.value);
                      const quantity = Number.isFinite(q) ? q : 0;
                      const unitPrice = item.unitPrice ?? 0;
                      const total = Math.round(quantity * unitPrice * 100) / 100;
                      onItemChange(item.id, { quantity, total });
                    }}
                  />
                </label>

                <label className={styles.itemField}>
                  <span className={styles.itemFieldLabel}>Unitat</span>
                  <select
                    className={styles.itemFieldInput}
                    value={item.unitLabel ?? "partida"}
                    onChange={(e) =>
                      onItemChange(item.id, {
                        unitLabel: e.target.value as BudgetClientItem["unitLabel"],
                      })
                    }
                  >
                    <option value="partida">partida</option>
                    <option value="unitat">unitat</option>
                    <option value="m²">m²</option>
                  </select>
                </label>

                <label className={styles.itemField}>
                  <span className={styles.itemFieldLabel}>Preu</span>
                  <input
                    className={styles.itemFieldInput}
                    type="number"
                    inputMode="decimal"
                    value={item.unitPrice ?? 0}
                    min={0}
                    step="0.01"
                    onChange={(e) => {
                      const p = Number(e.target.value);
                      const unitPrice = Number.isFinite(p) ? p : 0;
                      const quantity = item.quantity ?? 1;
                      const total = Math.round(quantity * unitPrice * 100) / 100;
                      onItemChange(item.id, { unitPrice, total });
                    }}
                  />
                </label>
              </div>
            ) : null}

            <textarea
              className={styles.descTextarea}
              value={item.description}
              onChange={(e) => handleDescriptionChange(item.id, e.target.value)}
              rows={4}
              placeholder="Descripció de la partida…"
            />
          </li>
        ))}
      </ul>

      {mode === "edit" && itemsFooter ? (
        <div className={styles.itemsFooter}>{itemsFooter}</div>
      ) : null}

      <div className={styles.footer}>
        <span className={styles.totalLabel}>Total pressupost</span>
        <span className={styles.totalValue}>{formatEUR(subtotal)}</span>
        {saveError ? (
          <p className={styles.saveError} role="alert">
            {saveError}
          </p>
        ) : null}
        <button
          type="button"
          className={styles.generatePdfBtn}
          onClick={handleSaveBudget}
          disabled={!draftComplete || isSaving}
        >
          {isSaving
            ? "Guardant pressupost…"
            : mode === "edit"
              ? "Guardar canvis"
              : "Guardar pressupost"}
        </button>
      </div>
    </section>
  );
}
