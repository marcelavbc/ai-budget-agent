import Image from "next/image";
import Link from "next/link";
import styles from "./Logo.module.css";

const LOGO_SRC = "/logo-sanmarti2.png";
const LOGO_W = 1536;
const LOGO_H = 1024;

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
      <Image
        src={LOGO_SRC}
        alt="Sanmartí Pintura Decorativa"
        width={LOGO_W}
        height={LOGO_H}
        className={styles.image}
        priority
        sizes="(max-width: 520px) 420px, 520px"
      />
    </Link>
  );
}
