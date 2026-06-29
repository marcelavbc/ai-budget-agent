"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Search, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { MergeContactsDialog } from "@/features/contacts/components/MergeContactsDialog";
import type { ContactWithFlags } from "@/features/contacts/lib/contacts";
import { deleteContact } from "@/features/contacts/lib/contactsClient";
import styles from "./ContactsView.module.css";

type Props = {
  contacts: ContactWithFlags[];
};

function filterContacts(
  contacts: ContactWithFlags[],
  query: string
): ContactWithFlags[] {
  const q = query.trim().toLowerCase();
  if (!q) return contacts;
  return contacts.filter((c) => (c.name ?? "").toLowerCase().includes(q));
}

export function ContactsView({ contacts }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    name: string | null;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);

  const filtered = useMemo(
    () => filterContacts(contacts, query),
    [contacts, query]
  );

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleMergeClick() {
    setMergeDialogOpen(true);
  }

  function handleMergeConfirm(survivorId: string, discardedIds: string[]) {
    console.log("Merge confirmado (todavía sin persistir):", {
      survivorId,
      discardedIds,
    });
    alert(`Próximo paso: ejecutar el merge real (superviviente: ${survivorId})`);
    setMergeDialogOpen(false);
  }

  function handleDeleteClick(id: string, name: string | null) {
    setDeleteError(null);
    setPendingDelete({ id, name });
  }

  async function handleDeleteContact(id: string) {
    await deleteContact(id);
    router.refresh();
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await handleDeleteContact(pendingDelete.id);
      setPendingDelete(null);
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : "No s'ha pogut eliminar el contacte."
      );
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className={styles.viewRoot}>
      {deleteError ? (
        <p className={styles.deleteError} role="alert">
          {deleteError}
        </p>
      ) : null}

      <div className={styles.filterRow}>
        <div className={styles.search}>
          <span className={styles.searchIcon} aria-hidden="true">
            <Search size={14} />
          </span>
          <input
            className={`${styles.input} ${styles.searchInput}`}
            placeholder="Cerca per nom"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Cerca contactes"
          />
        </div>
        <div className={styles.filterMeta} aria-live="polite">
          <span className={styles.results}>
            {filtered.length} de {contacts.length}
          </span>
          {selectedIds.size > 0 && (
            <span className={styles.selectedCount}>
              {selectedIds.size} seleccionat{selectedIds.size !== 1 ? "s" : ""}
            </span>
          )}
          {selectedIds.size >= 2 && (
            <button
              type="button"
              className={styles.mergeButton}
              onClick={handleMergeClick}
            >
              Fusionar ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th} style={{ width: 32 }}>
                <span className={styles.srOnly}>Seleccionar</span>
              </th>
              <th className={styles.th}>Nom</th>
              <th className={`${styles.th} ${styles.colActions}`}>Accions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((contact) => (
              <tr key={contact.id} className={styles.tr}>
                <td className={styles.td}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(contact.id)}
                    onChange={() => toggleSelected(contact.id)}
                    aria-label={`Seleccionar ${contact.name ?? "contacte"}`}
                  />
                </td>
                <td className={styles.td}>
                  {contact.name ?? "—"}
                  {contact.hasNoBudgetsOrInvoices && (
                    <span className={styles.badgeEmpty}>
                      Sense pressupostos
                    </span>
                  )}
                </td>
                <td className={`${styles.td} ${styles.colActions}`}>
                  <div className={styles.rowActions}>
                    <Link
                      href={`/contacts/${contact.id}`}
                      aria-label="Veure contacte"
                    >
                      <button
                        className={styles.iconBtn}
                        type="button"
                        tabIndex={-1}
                      >
                        <Eye size={16} />
                      </button>
                    </Link>
                    <span
                      className={styles.iconBtnWrap}
                      title={
                        contact.hasNoBudgetsOrInvoices
                          ? undefined
                          : "No es pot eliminar: té pressupostos o factures associades"
                      }
                    >
                      <button
                        className={styles.iconBtn}
                        type="button"
                        aria-label="Eliminar contacte"
                        disabled={!contact.hasNoBudgetsOrInvoices}
                        onClick={() =>
                          handleDeleteClick(contact.id, contact.name)
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Eliminar contacte?"
        description={
          pendingDelete?.name
            ? `Vols eliminar «${pendingDelete.name}»? Aquesta acció no es pot desfer.`
            : "Vols eliminar aquest contacte? Aquesta acció no es pot desfer."
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancel·lar"
        destructive
        loading={deleting}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      {mergeDialogOpen && (
        <MergeContactsDialog
          contacts={contacts.filter((c) => selectedIds.has(c.id))}
          onClose={() => setMergeDialogOpen(false)}
          onConfirm={handleMergeConfirm}
        />
      )}
    </div>
  );
}
