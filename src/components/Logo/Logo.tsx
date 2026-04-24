import Link from "next/link";
import styles from "./Logo.module.css";

export type LogoSize = "small" | "medium" | "large";

export function Logo({
  size = "medium",
  className = "",
}: {
  size?: LogoSize;
  className?: string;
}) {
  const sizeClass =
    size === "small"
      ? styles.sizeSmall
      : size === "large"
        ? styles.sizeLarge
        : styles.sizeMedium;

  return (
    <Link
      href="/"
      aria-label="Ir a l'inici"
      className={`${styles.root} ${sizeClass} ${className}`}
    >
      <span className={styles.title}>SANMARTÍ</span>
      <span className={styles.rule} aria-hidden="true" />
      <span className={styles.subtitle}>PINTURA DECORATIVA</span>
    </Link>
  );
}

