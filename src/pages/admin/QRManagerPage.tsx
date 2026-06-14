import { useState, useMemo } from 'react'
import { PlusCircle, QrCode, Printer, AlertCircle } from 'lucide-react'
import { useTenantContext } from '@app/providers/TenantProvider'
import {
  useTables,
  useCreateTable,
  TableQRCard,
  AddTableModal,
  PrintableQRs,
} from '@features/qr'
import { useAdminMenus } from '@features/dishes'
import { Button } from '@shared/ui/components/Button'
import { Spinner } from '@shared/ui/components/Spinner'
import { ROUTES } from '@shared/constants/routes'

function buildMenuUrl(tenantId: string, tableId: string): string {
  const base = ROUTES.public.menu.replace(':tenantId', tenantId)
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  const baseUrl = import.meta.env.VITE_APP_URL || (isLocalhost ? 'http://192.168.100.130:4001' : window.location.origin)
  return `${baseUrl}${base}?tableId=${tableId}`
}

export default function QRManagerPage() {
  const { tenantId, tenant } = useTenantContext()
  const { data: tables, isLoading, error } = useTables(tenantId)
  const { createTable, isLoading: isCreating, error: createError } = useCreateTable(tenantId)
  const [showAddModal, setShowAddModal] = useState(false)
  const [qrBgColor, setQrBgColor] = useState('#ffffff')

  const { data: menus } = useAdminMenus(tenantId)
  const defaultMenuId = menus?.[0]?.id ?? ''

  const sortedTables = useMemo(() => {
    if (!tables) return []
    return [...tables].sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true }))
  }, [tables])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="print:hidden space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-600">
              Acceso al menú
            </p>
            <h1 className="text-[22px] font-black leading-tight tracking-tight text-surface-900">
              Códigos QR
            </h1>
            <p className="text-[14px] text-surface-500">
              Gestiona los códigos QR de cada mesa para que los clientes escaneen y ordenen.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {sortedTables && sortedTables.length > 0 && (
              <>
                <div className="flex items-center gap-2 mr-2 bg-white px-2 py-1.5 rounded-xl border border-zinc-200 shadow-sm">
                  <label htmlFor="qr-bg" className="text-[11px] font-bold text-zinc-500 uppercase tracking-wide">
                    Fondo
                  </label>
                  <input
                    id="qr-bg"
                    type="color"
                    value={qrBgColor}
                    onChange={(e) => setQrBgColor(e.target.value)}
                    className="h-6 w-8 cursor-pointer rounded-md border-0 p-0"
                    title="Color de fondo de las tarjetas QR"
                  />
                </div>
                <Button
                  variant="secondary"
                  onClick={() => window.print()}
                  className="rounded-xl bg-white border-zinc-200 shadow-sm hover:bg-zinc-50 text-zinc-700"
                  title="Imprimir todos los QR generados"
                >
                  <Printer size={15} className="mr-2 text-zinc-400" />
                  Imprimir
                </Button>
              </>
            )}
            <Button
              onClick={() => setShowAddModal(true)}
              disabled={!defaultMenuId}
              title={!defaultMenuId ? 'Crea un menú primero antes de agregar mesas' : undefined}
              className="rounded-xl shadow-md bg-amber-500 hover:bg-amber-600 border-none"
            >
              <PlusCircle size={15} className="mr-2" />
              Nueva mesa
            </Button>
          </div>
        </div>

        {/* Banner explicativo */}
        <div className="flex items-start gap-3 rounded-2xl bg-amber-50/80 px-4 py-3.5 border border-amber-200/60 shadow-sm">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <span className="text-[16px]">📱</span>
          </div>
          <div className="flex flex-col mt-0.5">
            <p className="text-[13px] font-bold text-amber-900">
              Menú Digital en las mesas
            </p>
            <p className="text-[13px] text-amber-800/80 leading-relaxed">
              Estos son los códigos QR para tus mesas. Puedes imprimirlos y colocarlos en el local; tus clientes los escanearán para ver el menú y pedir directamente.
            </p>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3 bg-red-50 border border-red-100"
          >
            <AlertCircle size={15} className="text-red-500 shrink-0" />
            <p className="text-[13px] text-red-700">
              Error cargando las mesas. Recarga la página.
            </p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && sortedTables?.length === 0 && (
          <div
            className="flex flex-col items-center justify-center rounded-2xl py-16 text-center border-2 border-dashed border-zinc-200 bg-white p-6 shadow-sm"
          >
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-400"
            >
              <QrCode size={24} strokeWidth={1.5} />
            </div>
            <p className="mt-4 text-[15px] font-bold text-zinc-800">Sin mesas registradas</p>
            <p className="mt-1 text-[13px] text-zinc-500 max-w-[280px]">
              Agrega tu primera mesa para generar su código QR de acceso.
            </p>
            <Button
              className="mt-5 rounded-xl shadow-sm"
              onClick={() => setShowAddModal(true)}
              disabled={!defaultMenuId}
              title={!defaultMenuId ? 'Crea un menú primero' : undefined}
            >
              <PlusCircle size={15} className="mr-2" />
              Agregar mesa
            </Button>
          </div>
        )}

        {/* Table grid */}
        {!isLoading && !error && sortedTables && sortedTables.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {sortedTables.map((table) => (
              <TableQRCard
                key={table.id}
                table={table}
                tenant={tenant!}
                bgColor={qrBgColor}
                buildMenuUrl={(tableId) => buildMenuUrl(tenantId, tableId)}
              />
            ))}
          </div>
        )}

        {/* Add table modal */}
        {showAddModal && (
          <AddTableModal
            menuId={defaultMenuId}
            isLoading={isCreating}
            error={createError}
            onSubmit={async (valuesArray) => {
              for (const values of valuesArray) {
                await createTable(values)
              }
              setShowAddModal(false)
            }}
            onClose={() => setShowAddModal(false)}
          />
        )}
      </div>

      {/* Printable QRs */}
      {sortedTables && sortedTables.length > 0 && (
        <PrintableQRs 
          tables={sortedTables} 
          branding={tenant!.branding} 
          restaurantName={tenant!.name}
          bgColor={qrBgColor}
          buildMenuUrl={(tableId) => buildMenuUrl(tenantId, tableId)}
        />
      )}
    </div>
  )
}
