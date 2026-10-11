/*
 * Money formatting — design-system.md §15 rule 7:
 *
 *   "Currency via `formatMoney({ amount, currency })` — symbol never
 *    hard-coded."
 *
 * The symbol lives in ONE place (the table below), keyed by the ISO code the
 * API sends in every `Money` contract (`{ amount, currency }` — api.md §1.16).
 * Components and screens import `formatMoney`; nothing outside this file is
 * allowed to write "LKR", "Rs" or "₨" into a string literal, which is what
 * makes adding a second currency a data change rather than a search-and-
 * replace across the UI.
 *
 * Two deliberate deviations from `Intl.NumberFormat({ style: "currency" })`:
 *
 *   1. CLDR's symbol for LKR is "Rs" / "රු", but every worked example in the
 *      spec corpus (business-flows.md, api.md, domain-model.md) prints the
 *      ISO code — "LKR 204,180.00". A config table keeps us honest to the
 *      product's own examples instead of overruling them with locale data.
 *   2. Grouping and decimal separators still come from `Intl`, keyed by the
 *      caller's locale, so `si` and `en` number formatting diverge exactly
 *      where CLDR says it should — and nowhere else.
 *
 * An unknown currency falls back to its own code rather than a guessed
 * symbol: showing "LKR" where you do not know the currency is wrong, showing
 * the code the server actually sent is merely plain.
 */

/** ISO 4217 code → display symbol. The complete currency config. */
const CURRENCY_SYMBOLS: Record<string, string> = {
  LKR: "LKR",
};

/**
 * Display symbol for a currency code, from config (§15.7).
 * Unknown codes return the upper-cased code itself — the server's truth,
 * never an invented glyph.
 */
export function currencySymbol(currency: string): string {
  const code = currency.toUpperCase();
  return CURRENCY_SYMBOLS[code] ?? code;
}

export interface FormatMoneyOptions {
  /** Decimal-serialized amount, as the API sends it (`482500.0000`). */
  amount: number | string;
  /** ISO 4217 code from the `Money` contract. */
  currency: string;
  /** BCP-47 tag for number formatting. Defaults to `en`. */
  locale?: string;
  /** Fraction digits. Prices render at 2 (the spec's worked examples); pass
   *  4 for raw API parity with the decimal(18,4) columns. Defaults to 2. */
  fractionDigits?: number;
}

/**
 * `formatMoney({ amount, currency })` — §15.7's signature.
 *
 * Renders `<symbol> <grouped number>`: "LKR 204,180.00". The symbol comes
 * from config, the grouping from `Intl` for the given locale.
 *
 * Throws `RangeError` on a non-finite amount. Money arrives from a
 * backend-authoritative API; a NaN here is a wiring bug, and printing
 * "LKR NaN" in front of a buyer would be the kind of silent lie §0.6 exists
 * to forbid — fail loudly instead.
 */
export function formatMoney({
  amount,
  currency,
  locale = "en",
  fractionDigits = 2,
}: FormatMoneyOptions): string {
  const numeric = typeof amount === "string" ? Number.parseFloat(amount) : amount;

  if (!Number.isFinite(numeric)) {
    throw new RangeError(`formatMoney: amount is not a finite number (received ${String(amount)})`);
  }

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(numeric);

  return `${currencySymbol(currency)} ${formatted}`;
}
