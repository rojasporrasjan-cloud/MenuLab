// Fuente única de verdad: locale del tenant → moneda ISO + símbolo.
// Multi-tenant LATAM: cada restaurante opera en su propia moneda según su
// locale (es-CR → CRC, es-MX → MXN, pt-BR → BRL…). Nunca hardcodear 'CRC'
// dentro de una página o componente.

const LOCALE_CURRENCY: Record<string, string> = {
  'es-CR': 'CRC',
  'es-MX': 'MXN',
  'es-ES': 'EUR',
  'en-US': 'USD',
  'pt-BR': 'BRL',
}

const FALLBACK_CURRENCY = 'CRC'

/** Código ISO de moneda para un locale del tenant. */
export function currencyForLocale(locale: string): string {
  return LOCALE_CURRENCY[locale] ?? FALLBACK_CURRENCY
}

/** Símbolo de la moneda (₡, $, R$, €…) derivado del locale + código ISO. */
export function currencySymbol(locale: string, currency: string): string {
  const parts = new Intl.NumberFormat(locale, { style: 'currency', currency }).formatToParts(0)
  return parts.find((part) => part.type === 'currency')?.value ?? currency
}
