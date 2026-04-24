"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./Header.module.css";
import { Logo } from "@/components/Logo/Logo";

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const navItems = useMemo(
    () => [
      { href: "/", label: "Tauler" },
      { href: "/budgets/nou", label: "Nou pressupost" },
      { href: "/budgets", label: "Pressupostos" },
    ],
    []
  );

  const activeHref = useMemo(() => {
    const items = [...navItems].sort((a, b) => b.href.length - a.href.length);
    for (const item of items) {
      if (item.href === "/") {
        if (pathname === "/") return item.href;
        continue;
      }
      if (pathname === item.href || pathname.startsWith(item.href + "/")) {
        return item.href;
      }
    }
    return null;
  }, [navItems, pathname]);

  const menuId = "mobile-nav";

  useEffect(() => {
    // Close menu on route change.
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    if (!mounted) return;
    const t = window.setTimeout(() => setMounted(false), 200);
    return () => window.clearTimeout(t);
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Tab") {
        const root = panelRef.current;
        if (!root) return;
        const focusables = Array.from(
          root.querySelectorAll<HTMLElement>(
            'a,button,[tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        if (e.shiftKey) {
          if (active === first || active === root) {
            e.preventDefault();
            last.focus();
          }
        } else if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Logo size="small" className={styles.logo} />

        <nav className={styles.nav} aria-label="Navegació">
          {navItems.map((item) => {
            const active = activeHref === item.href;
            return (
              <Link
                key={item.href}
                className={`${styles.navLink} ${
                  active ? styles.navLinkActive : ""
                }`}
                href={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className={styles.menuButton}
          aria-label={open ? "Tancar menú" : "Obrir menú"}
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((v) => !v)}
        >
          <span className={styles.menuIcon} aria-hidden="true" />
        </button>
      </div>

      {mounted ? (
        <div
          className={`${styles.mobileOverlay} ${
            open ? styles.mobileOverlayOpen : ""
          }`}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            id={menuId}
            className={`${styles.mobilePanel} ${
              open ? styles.mobilePanelOpen : ""
            }`}
            ref={panelRef}
            tabIndex={-1}
          >
            <button
              type="button"
              className={styles.mobileClose}
              onClick={() => setOpen(false)}
              aria-label="Tancar"
            >
              <span aria-hidden="true">✕</span>
            </button>

            <div className={styles.mobileLinks} aria-label="Navegació">
              {navItems.map((item) => {
                const active = activeHref === item.href;
                return (
                  <Link
                    key={item.href}
                    className={`${styles.mobileLink} ${
                      active ? styles.mobileLinkActive : ""
                    }`}
                    href={item.href}
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
