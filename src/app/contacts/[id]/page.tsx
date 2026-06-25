import { notFound } from "next/navigation";
import { getContactDetail } from "@/features/contacts/lib/contacts";
import { ContactDetailView } from "@/features/contacts/components/ContactDetailView";
import styles from "./page.module.css";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getContactDetail(id);
  if (!detail) notFound();

  return (
    <main className={styles.main}>
      <ContactDetailView detail={detail} />
    </main>
  );
}
