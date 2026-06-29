"use client";

import { useEffect, useRef, useState } from "react";
import type { ContactRow, JobAddress } from "@/features/contacts/lib/contacts";
import {
  suggestMergeSurvivorAmong,
  suggestMergeSurvivorAmongWithJobAddresses,
} from "@/features/contacts/lib/contactMerge";
import styles from "./MergeContactsDialog.module.css";

type Props = {
  contacts: ContactRow[];
  onClose: () => void;
  onConfirm: (survivorId: string, discardedIds: string[]) => void;
};

export function MergeContactsDialog({ contacts, onClose, onConfirm }: Props) {
  const initialSuggested = suggestMergeSurvivorAmong(contacts);
  const [survivorId, setSurvivorId] = useState(initialSuggested.id);
  const [suggestedId, setSuggestedId] = useState(initialSuggested.id);
  const userPickedRef = useRef(false);
  const [jobAddressesByContact, setJobAddressesByContact] = useState<
    Record<string, JobAddress[]>
  >({});

  useEffect(() => {
    let cancelled = false;
    async function loadAddresses() {
      const entries = await Promise.all(
        contacts.map(async (c) => {
          const res = await fetch(`/api/contacts/${c.id}/job-addresses`);
          const json = await res.json();
          return [c.id, json.addresses ?? []] as const;
        })
      );
      if (!cancelled) {
        setJobAddressesByContact(Object.fromEntries(entries));
        const counts = Object.fromEntries(
          entries.map(([id, addrs]) => [id, addrs.length])
        );
        const recalculated = suggestMergeSurvivorAmongWithJobAddresses(
          contacts,
          counts
        );
        setSuggestedId(recalculated.id);
        if (!userPickedRef.current) {
          setSurvivorId(recalculated.id);
        }
      }
    }
    loadAddresses();
    return () => {
      cancelled = true;
    };
  }, [contacts]);

  function handleConfirm() {
    const discardedIds = contacts
      .filter((c) => c.id !== survivorId)
      .map((c) => c.id);
    onConfirm(survivorId, discardedIds);
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog} role="dialog" aria-modal="true">
        <h2 className={styles.title}>Fusionar contactes</h2>
        <p className={styles.subtitle}>
          Selecciona quin contacte vols mantenir. Es suggereix el que té més
          dades.
        </p>
        <ul className={styles.list}>
          {contacts.map((contact) => (
            <li key={contact.id} className={styles.item}>
              <label className={styles.label}>
                <input
                  type="radio"
                  name="survivor"
                  checked={survivorId === contact.id}
                  onChange={() => {
                    userPickedRef.current = true;
                    setSurvivorId(contact.id);
                  }}
                />
                <span>
                  {contact.name}
                  {contact.id === suggestedId && (
                    <span className={styles.badge}>Suggerit</span>
                  )}
                </span>
              </label>

              {(jobAddressesByContact[contact.id] ?? []).map((addr, i) => {
                const parts = [addr.street, addr.postalCode, addr.city]
                  .map((v) => (v ?? "").trim())
                  .filter(Boolean);
                if (parts.length === 0) return null;
                return (
                  <p key={i} className={styles.jobAddress}>
                    Obra: {parts.join(", ")}
                  </p>
                );
              })}
            </li>
          ))}
        </ul>
        <div className={styles.actions}>
          <button type="button" onClick={onClose}>
            Cancel·lar
          </button>
          <button type="button" onClick={handleConfirm}>
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
