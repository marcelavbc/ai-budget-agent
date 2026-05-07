"use client";

export default function BudgetEditError({ reset }: { reset: () => void }) {
  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>S&apos;ha produït un error</h1>
      <p>No s&apos;ha pogut carregar el pressupost.</p>
      <button onClick={reset}>Torna-ho a provar</button>
    </main>
  );
}
