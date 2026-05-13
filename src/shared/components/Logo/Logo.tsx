import Image from "next/image";
import Link from "next/link";
import styles from "./Logo.module.css";

const LOGO_SRC = "/logo-sanmarti3.png";
const LOGO_W = 1536;
const LOGO_H = 1024;

export type LogoSize = "small" | "medium" | "large" | "hero";

export function Logo({
  size = "medium",
  className = "",
  linkable = true,
  /** Omple l’amplada del contenidor (p. ex. targeta login); evita amplada 0 amb max-width % a la imatge. */
  fullWidth = false,
}: {
  size?: LogoSize;
  className?: string;
  /** When false, renders a non-interactive mark (e.g. login screen). */
  linkable?: boolean;
  fullWidth?: boolean;
}) {
  const sizeClass =
    size === "small"
      ? styles.sizeSmall
      : size === "large"
        ? styles.sizeLarge
        : size === "hero"
          ? styles.sizeHero
          : styles.sizeMedium;

  const rootClass = [
    styles.root,
    fullWidth ? styles.rootFullWidth : "",
    sizeClass,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const image = (
    <Image
      src={LOGO_SRC}
      alt="Sanmartí Pintura Decorativa"
      width={LOGO_W}
      height={LOGO_H}
      className={styles.image}
      priority
      sizes="(max-width: 520px) 90vw, 320px"
    />
  );

  if (!linkable) {
    return <span className={rootClass}>{image}</span>;
  }

  return (
    <Link href="/" aria-label="Ir a l'inici" className={rootClass}>
      {image}
    </Link>
  );
}
