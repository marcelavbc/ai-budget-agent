export function formatEUR(amount: number) {
  const formatter = new Intl.NumberFormat("ca-ES", {
    style: "currency",
    currency: "EUR",
  });

  return formatter.format(amount);
}
