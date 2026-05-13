"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/shared/components/Logo/Logo";
import styles from "./login.module.css";

const PASSWORD_ID = "login-password";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/");
    } else {
      setError("Contrasenya incorrecta");
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <Logo size="hero" linkable={false} fullWidth />
        </div>
        <h1 className={styles.title}>Accés intern</h1>
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
          noValidate
        >
          <div className={styles.field}>
            <label className={styles.label} htmlFor={PASSWORD_ID}>
              Contrasenya
            </label>
            <input
              id={PASSWORD_ID}
              className={styles.input}
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Introdueix la contrasenya"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "login-error" : undefined}
            />
          </div>
          <button
            type="submit"
            className={styles.submit}
            disabled={loading || password.length === 0}
            aria-busy={loading}
          >
            {loading ? "Entrant…" : "Entrar"}
          </button>
          {error ? (
            <p id="login-error" className={styles.error} role="alert">
              {error}
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
