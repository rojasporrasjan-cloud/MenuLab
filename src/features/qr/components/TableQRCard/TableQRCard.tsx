import { useState } from 'react'
import { Edit2, Check, X } from 'lucide-react'
import { Button } from '@shared/ui/components/Button'
import type { Table } from '@core/domain/entities/Table'
import type { Tenant } from '@core/domain/entities/Tenant'
import { useUpdateTable } from '../../hooks/useUpdateTable'
import { QRCodeSVG } from 'qrcode.react'
import { isDarkColor } from '@shared/utils/colorScale'

interface TableQRCardProps {
  table: Table
  tenant: Tenant
  bgColor?: string
  buildMenuUrl: (tableId: string) => string
}

export function TableQRCard({
  table,
  tenant,
  bgColor = '#ffffff',
  buildMenuUrl,
}: TableQRCardProps) {
  const menuUrl = buildMenuUrl(table.id)
  const primaryColor = tenant.branding.primaryColor || '#e11d48'
  const isDark = isDarkColor(bgColor)
  const textColor = isDark ? '#ffffff' : '#0f172a'
  const mutedTextColor = isDark ? 'rgba(255,255,255,0.7)' : '#71717a'

  const { updateTable, isLoading: isUpdating } = useUpdateTable(table.tenantId)

  const [isEditing, setIsEditing] = useState(false)
  const [editNumber, setEditNumber] = useState(table.number)
  const [editLabel, setEditLabel] = useState(table.label || '')

  const handleSave = async () => {
    if (!editNumber.trim()) return
    await updateTable(table.id, { number: editNumber.trim(), label: editLabel.trim() })
    setIsEditing(false)
  }

  return (
    <div
      className="group flex flex-col gap-4 p-4 transition-all duration-300 hover:-translate-y-1"
      style={{
        background: bgColor,
        borderRadius: '24px',
        border:     isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(228, 228, 231, 0.8)',
        boxShadow:  '0 2px 8px -2px rgba(0,0,0,0.05), 0 8px 24px -8px rgba(0,0,0,0.05)',
        color:      textColor,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between min-h-[44px]">
        {isEditing ? (
          <div className="flex flex-col gap-2 w-full pr-2">
            <input
              autoFocus
              type="text"
              value={editNumber}
              onChange={(e) => setEditNumber(e.target.value)}
              placeholder="Número (Ej: 1)"
              style={{ color: '#0f172a' }}
              className="w-full rounded-xl border border-zinc-200 px-3 py-1.5 text-[14px] font-bold shadow-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none transition-all"
            />
            <input
              type="text"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              placeholder="Descripción (opcional)"
              style={{ color: '#0f172a' }}
              className="w-full rounded-xl border border-zinc-200 px-3 py-1.5 text-[12px] shadow-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 focus:outline-none transition-all"
            />
            <div className="flex gap-2 mt-1">
              <Button size="sm" className="flex-1 h-8 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 border-none shadow-sm" onClick={handleSave} isLoading={isUpdating}>
                <Check size={14} className="mr-1" /> Guardar
              </Button>
              <Button size="sm" variant="secondary" className="h-8 w-8 px-0 rounded-lg bg-white border-zinc-200 shadow-sm" onClick={() => setIsEditing(false)}>
                <X size={14} className="text-zinc-500" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-[16px] font-black tracking-tight" style={{ color: textColor }}>
                Mesa {table.number}
              </p>
              <button
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-white/50 hover:bg-white text-zinc-400 hover:text-amber-600 shadow-sm border border-black/5"
                aria-label="Editar mesa"
              >
                <Edit2 size={13} strokeWidth={2.5} />
              </button>
            </div>
            {table.label && (
              <p className="text-[12px] font-medium mt-0.5" style={{ color: mutedTextColor }}>{table.label}</p>
            )}
          </div>
        )}
      </div>

      {/* Beautiful QR preview */}
      <div
        className="flex flex-col items-center justify-center rounded-[20px] p-5 overflow-hidden relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-transform group-hover:scale-[1.02]"
        style={{ border: `1px solid ${primaryColor}30`, background: '#ffffff' }}
      >
        <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: primaryColor }} />
        
        {tenant.branding.logoUrl ? (
          <img src={tenant.branding.logoUrl} alt="Logo" className="h-8 w-8 object-contain rounded-md mb-3" />
        ) : (
          <p className="text-[11px] font-black uppercase tracking-wider text-zinc-800 mb-3">{tenant.name}</p>
        )}
        
        <QRCodeSVG
          value={menuUrl}
          size={110}
          level="Q"
          includeMargin={false}
          fgColor="#000000"
          bgColor="#ffffff"
        />
      </div>
    </div>
  )
}
