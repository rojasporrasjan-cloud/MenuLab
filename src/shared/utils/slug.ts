/**
 * Convierte un texto libre en un slug seguro para URLs e IDs de Firestore.
 * "Soda La Rústica!" → "soda-la-rustica"
 */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita acentos (combining diacritics)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // no alfanumérico → guion
    .replace(/^-+|-+$/g, '') // recorta guiones de los extremos
    .slice(0, 40)
}

/**
 * Genera un slug único añadiendo un sufijo aleatorio corto.
 * Evita colisiones cuando dos restaurantes comparten nombre.
 * Usa crypto.randomUUID() (CSPRNG) en lugar de Math.random() para
 * evitar IDs predecibles (CWE-327).
 */
export function uniqueSlug(input: string): string {
  const base = slugify(input) || 'restaurante'
  const suffix = crypto.randomUUID().replace(/-/g, '').slice(0, 7)
  return `${base}-${suffix}`
}
