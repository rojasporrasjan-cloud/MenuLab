/**
 * Búsqueda de menú insensible a acentos y mayúsculas.
 *
 * Utilidad pura (sin dependencias de dominio): recibe los campos de texto a
 * comparar, no la entidad. Así "rustica" encuentra "rústica" y viceversa.
 */

/** Normaliza un texto: quita diacríticos, pasa a minúsculas y recorta. */
export function normalizeForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

/**
 * ¿Alguno de los campos contiene la búsqueda? Insensible a acentos/mayúsculas.
 * Una búsqueda vacía coincide con todo.
 */
export function matchesQuery(fields: ReadonlyArray<string | null | undefined>, query: string): boolean {
  const q = normalizeForSearch(query)
  if (!q) return true
  return fields.some((field) => typeof field === 'string' && normalizeForSearch(field).includes(q))
}
