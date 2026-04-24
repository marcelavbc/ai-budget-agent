import Link from "next/link";
import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <span className={styles.name}>Sanmartí Pintura Decorativa</span>
        <nav className={styles.nav} aria-label="Navegació">
          <Link className={styles.navLink} href="/">
            Tauler
          </Link>
          <Link className={styles.navLink} href="/budgets/nou">
            Nou pressupost
          </Link>
          <Link className={styles.navLink} href="/budgets">
            Pressupostos
          </Link>
        </nav>
      </div>
    </header>
  );
}
