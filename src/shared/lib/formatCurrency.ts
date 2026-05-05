const eurFormatter = new Intl.NumberFormat("ca-ES", {
  style: "currency",
  currency: "EUR",
});

export function formatEUR(amount: number) {
  return eurFormatter.format(amount);
}
