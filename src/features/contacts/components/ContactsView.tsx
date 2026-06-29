"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Search } from "lucide-react";
import type { ContactWithFlags } from "@/features/contacts/lib/contacts";
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
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => filterContacts(contacts, query),
    [contacts, query]
  );

  return (
    <div className={styles.viewRoot}>
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
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Nom</th>
              <th className={styles.th}>Ciutat</th>
              <th className={styles.th}>NIF</th>
              <th className={`${styles.th} ${styles.colActions}`}>Accions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((contact) => (
              <tr key={contact.id} className={styles.tr}>
                <td className={styles.td}>
                  {contact.name ?? "—"}
                  {contact.hasNoBudgetsOrInvoices && (
                    <span className={styles.badgeEmpty}>
                      Sense pressupostos
                    </span>
                  )}
                </td>
                <td className={styles.td}>
                  {contact.fiscal_address_city ?? "—"}
                </td>
                <td className={styles.td}>{contact.tax_id ?? "—"}</td>
                <td className={`${styles.td} ${styles.colActions}`}>
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
