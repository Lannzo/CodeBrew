export function currency(n) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" })
    .format(n || 0);
}
