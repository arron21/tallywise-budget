export function formatCents(cents: number): string {
  const isNegative = cents < 0;
  const absDollars = Math.abs(cents) / 100;
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absDollars);
  return isNegative ? `-${formatted}` : formatted;
}

export function formatWholeCents(cents: number): string {
  const isNegative = cents < 0;
  const absDollars = Math.round(Math.abs(cents) / 100);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(absDollars);
  return isNegative ? `-${formatted}` : formatted;
}

export function getCurrentMonthKey(date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getMonthLabel(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr) - 1;
  if (Number.isNaN(year) || Number.isNaN(month)) return monthKey;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month, 1)));
}

export function calcWorkHours(amountCents: number, hourlyNetPayCents: number): string {
  if (hourlyNetPayCents <= 0) return "0.0 hrs";
  const hours = Math.abs(amountCents) / hourlyNetPayCents;
  if (hours < 1) {
    return `${Math.round(hours * 60)} min of work`;
  }
  return `${hours.toFixed(1)} hrs of work`;
}

export function calcTenYearOpportunityCents(amountCents: number, annualRate = 0.07): number {
  return Math.round(Math.abs(amountCents) * Math.pow(1 + annualRate, 10));
}
