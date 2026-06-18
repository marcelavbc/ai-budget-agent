import { getContactList } from "@/features/contacts/lib/contacts";
import { ContactsView } from "@/features/contacts/components/ContactsView";
import styles from "./page.module.css";

export default async function ContactsPage() {
  const contacts = await getContactList();

  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <header className={styles.header}>
            <h1 className={styles.title}>Contactes</h1>
            <p className={styles.subtitle}>
              Tots els clients i contactes registrats.
            </p>
          </header>
        </div>
        <div className={styles.viewMount}>
          <ContactsView contacts={contacts} />
        </div>
      </div>
    </div>
  );
}
