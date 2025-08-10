export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "HNL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
