/**
 * Launch-market defaults. The schema stores a currency per listing, so adding markets later
 * means changing these defaults, not the data model.
 */
export const DEFAULT_CURRENCY = 'ZAR';
export const DEFAULT_COUNTRY_CALLING_CODE = '27';

const CURRENCY_SYMBOLS: Record<string, string> = { ZAR: 'R', USD: '$', EUR: '€', GBP: '£' };

/** Formats minor units as e.g. "R 4 500" or "R 4 500.50". Deterministic across platforms. */
export function formatPrice(cents: number, currency: string = DEFAULT_CURRENCY): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
  const whole = Math.floor(Math.abs(cents) / 100);
  const fraction = Math.abs(cents) % 100;
  const grouped = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const sign = cents < 0 ? '-' : '';
  const decimals = fraction ? `.${fraction.toString().padStart(2, '0')}` : '';
  return `${sign}${symbol.trim()} ${grouped}${decimals}`;
}

/**
 * Parses what people type ("4500", "4 500", "4,500", "4500.50", "4500,50") into cents.
 * Returns null if it isn't a valid amount.
 */
export function parsePriceToCents(input: string): number | null {
  let value = input.replace(/[\s ]/g, '').replace(/^R/i, '');
  if (value === '') return null;

  if (value.includes(',') && !value.includes('.')) {
    // A single comma followed by 1–2 digits is a decimal comma; otherwise thousands separators.
    value = /^\d+,\d{1,2}$/.test(value) ? value.replace(',', '.') : value.replace(/,/g, '');
  } else {
    value = value.replace(/,/g, '');
  }

  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const [whole = '0', fraction = ''] = value.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

/** Normalises a phone number to E.164 ("+27821234567"); local numbers get the default code. */
export function normaliseWhatsApp(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, '');
  let e164: string;
  if (digits.startsWith('+')) e164 = digits;
  else if (digits.startsWith('00')) e164 = `+${digits.slice(2)}`;
  else if (digits.startsWith('0')) e164 = `+${DEFAULT_COUNTRY_CALLING_CODE}${digits.slice(1)}`;
  else e164 = `+${digits}`;
  return /^\+[1-9]\d{7,14}$/.test(e164) ? e164 : null;
}
