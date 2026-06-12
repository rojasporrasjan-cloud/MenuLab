import type { Customer } from '@core/domain/entities/Customer'

const CSV_HEADERS = [
  'Nombre',
  'Teléfono',
  'Pedidos',
  'Gasto total',
  'Ticket promedio',
  'Último pedido',
  'Primer pedido',
  'Nota',
] as const

/** BOM para que Excel detecte UTF-8 (tildes en nombres). */
const UTF8_BOM = String.fromCharCode(0xfeff)

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function dateISO(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : ''
}

/** Genera y descarga un CSV con la lista de clientes. */
export const CustomerCsvService = {
  download(customers: readonly Customer[], fileName: string): void {
    const rows = customers.map((c) =>
      [
        c.name,
        c.phone,
        String(c.totalOrders),
        c.totalSpent.toFixed(2),
        c.averageTicket.toFixed(2),
        dateISO(c.lastOrderAt),
        dateISO(c.firstOrderAt),
        c.note ?? '',
      ]
        .map(csvEscape)
        .join(','),
    )
    const csv = [CSV_HEADERS.join(','), ...rows].join('\n')
    const blob = new Blob([UTF8_BOM + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
  },
} as const
