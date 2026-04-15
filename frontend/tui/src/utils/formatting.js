export function formatCurrency(amount) {
  const sign = amount >= 0 ? "+" : "";
  return `${sign}${amount.toFixed(2)}€`;
}

export function formatDate(dateStr) {
  return dateStr; // already YYYY-MM-DD from backend
}

export function truncate(str, maxLen) {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}

export function padRight(str, len) {
  return str.padEnd(len);
}

export function padLeft(str, len) {
  return str.padStart(len);
}
