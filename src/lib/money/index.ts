/** Integer minor-unit money helpers. Never use floating point for balances. */

export type Minor = bigint;

export function asMinor(value: number | string | bigint): Minor {
  if (typeof value === "bigint") return value;
  if (typeof value === "string") {
    if (!/^-?\d+$/.test(value.trim())) {
      return toMinor(value);
    }
    return BigInt(value);
  }
  return BigInt(Math.trunc(value));
}

export function toMinor(major: number | string, scale = 2): Minor {
  const raw = String(major).trim();
  const neg = raw.startsWith("-");
  const cleaned = neg ? raw.slice(1) : raw;
  const [wholePart, fracPart = ""] = cleaned.split(".");
  const whole = BigInt(wholePart || "0");
  const frac = BigInt((fracPart + "0".repeat(scale)).slice(0, scale) || "0");
  const base = BigInt(10) ** BigInt(scale);
  const minor = whole * base + frac;
  return neg ? -minor : minor;
}

export function fromMinor(minor: Minor | number | bigint, scale = 2): string {
  const value = typeof minor === "bigint" ? minor : BigInt(Math.trunc(minor));
  const neg = value < BigInt(0);
  const abs = neg ? -value : value;
  const base = BigInt(10) ** BigInt(scale);
  const whole = abs / base;
  const frac = abs % base;
  return `${neg ? "-" : ""}${whole.toString()}.${frac.toString().padStart(scale, "0")}`;
}

export function formatMinor(
  minor: Minor | number | bigint,
  currency = "PKR",
  scale = 2,
): string {
  const major = Number(fromMinor(minor, scale));
  try {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency,
      minimumFractionDigits: scale,
      maximumFractionDigits: scale,
    }).format(major);
  } catch {
    return `${currency} ${fromMinor(minor, scale)}`;
  }
}

export function addMinor(...parts: Array<Minor | number | bigint>): Minor {
  return parts.reduce<Minor>((a, b) => a + asMinor(b), BigInt(0));
}

export function subMinor(a: Minor | number | bigint, b: Minor | number | bigint): Minor {
  return asMinor(a) - asMinor(b);
}

export function assertBalanced(
  lines: { debitMinor: Minor | number | bigint; creditMinor: Minor | number | bigint }[],
) {
  const debits = lines.reduce((s, l) => s + asMinor(l.debitMinor), BigInt(0));
  const credits = lines.reduce((s, l) => s + asMinor(l.creditMinor), BigInt(0));
  if (debits !== credits) {
    throw new Error(`Unbalanced journal: debit ${debits} != credit ${credits}`);
  }
  if (debits < BigInt(0) || credits < BigInt(0)) {
    throw new Error("Negative debit/credit totals are not allowed");
  }
}

export function invoiceStatus(
  balanceMinor: Minor | number | bigint,
  amountMinor: Minor | number | bigint,
): string {
  const balance = asMinor(balanceMinor);
  const amount = asMinor(amountMinor);
  if (balance <= BigInt(0)) return "PAID";
  if (balance < amount) return "PARTIAL";
  return "OPEN";
}
