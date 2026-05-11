import { connection } from "next/server";
import { getInvoiceList } from "@/features/invoices/lib/invoices";
import styles from "./page.module.css";
import { InvoicesView } from "@/features/invoices/components/InvoicesView";

export default async function InvoicesPage() {
  await connection();

  const invoices = await getInvoiceList();

  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <header className={styles.header}>
            <h1 className={styles.title}>Factures</h1>
            <p className={styles.subtitle}>
              Totes les factures generades, ordenades per data d&apos;emissió
              del més
            </p>
          </header>

          <div className={styles.actions} />
        </div>

        {invoices.length === 0 ? (
          <section className={styles.empty}>
            <h2 className={styles.emptyTitle}>Encara no hi ha factures.</h2>
          </section>
        ) : (
          <div className={styles.viewMount}>
            <InvoicesView invoices={invoices} />
          </div>
        )}
      </div>
    </div>
  );
}
