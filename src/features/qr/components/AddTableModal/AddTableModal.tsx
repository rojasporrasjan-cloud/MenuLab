import { useState } from 'react'
import { X, Layers, Copy } from 'lucide-react'
import { Button } from '@shared/ui/components/Button'
import { cn } from '@shared/utils/cn'
import type { TableFormValues } from '../../types/qr.types'

interface AddTableModalProps {
  menuId: string
  isLoading: boolean
  error: string | null
  onSubmit: (values: TableFormValues[]) => Promise<void>
  onClose: () => void
}

export function AddTableModal({
  menuId,
  isLoading,
  error,
  onSubmit,
  onClose,
}: AddTableModalProps) {
  const [mode, setMode] = useState<'single' | 'multiple'>('single')
  
  // Single mode state
  const [number, setNumber] = useState('')
  const [label, setLabel] = useState('')
  
  // Multiple mode state
  const [startNumber, setStartNumber] = useState('1')
  const [count, setCount] = useState('10')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (mode === 'single') {
      if (!number.trim()) return
      await onSubmit([{ number: number.trim(), label: label.trim(), menuId }])
    } else {
      const start = parseInt(startNumber, 10)
      const amount = parseInt(count, 10)
      if (isNaN(start) || isNaN(amount) || amount <= 0 || amount > 50) return
      
      const tables: TableFormValues[] = []
      for (let i = 0; i < amount; i++) {
        tables.push({
          number: String(start + i),
          label: '',
          menuId,
        })
      }
      await onSubmit(tables)
    }
    
    if (!error) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-surface-0 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-surface-900">Agregar mesa</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Mode Selector */}
        <div className="mb-6 flex rounded-xl bg-zinc-100 p-1">
          <button
            type="button"
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg py-1.5 text-[13px] font-bold transition-all',
              mode === 'single' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
            )}
            onClick={() => setMode('single')}
          >
            <Copy size={14} />
            Única
          </button>
          <button
            type="button"
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg py-1.5 text-[13px] font-bold transition-all',
              mode === 'multiple' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
            )}
            onClick={() => setMode('multiple')}
          >
            <Layers size={14} />
            Múltiple
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {mode === 'single' ? (
            <>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="number" className="text-[12px] font-bold uppercase tracking-wide text-zinc-500">
                  Número o nombre de mesa
                </label>
                <input
                  id="number"
                  type="text"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="Ej: 1, 2, Terraza..."
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-[14px] shadow-sm transition-all focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                  autoFocus
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="label" className="text-[12px] font-bold uppercase tracking-wide text-zinc-500">
                  Descripción <span className="text-zinc-400 font-normal normal-case">(Opcional)</span>
                </label>
                <input
                  id="label"
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Ej: Mesa frente a la ventana"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-[14px] shadow-sm transition-all focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                />
              </div>
            </>
          ) : (
            <>
              <div className="rounded-xl bg-amber-50 p-4 border border-amber-200/50">
                <p className="text-[13px] text-amber-800 leading-relaxed">
                  Crearemos múltiples mesas de forma automática y secuencial. Útil si tienes muchas mesas numeradas.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="start" className="text-[12px] font-bold uppercase tracking-wide text-zinc-500">
                    Número inicial
                  </label>
                  <input
                    id="start"
                    type="number"
                    min="1"
                    value={startNumber}
                    onChange={(e) => setStartNumber(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-[14px] shadow-sm transition-all focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="count" className="text-[12px] font-bold uppercase tracking-wide text-zinc-500">
                    Cantidad (Máx 50)
                  </label>
                  <input
                    id="count"
                    type="number"
                    min="1"
                    max="50"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-[14px] shadow-sm transition-all focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                  />
                </div>
              </div>
            </>
          )}

          {error && <p className="text-[13px] text-red-500 font-medium">{error}</p>}

          <div className="mt-2 flex gap-3">
            <Button
              type="button"
              variant="secondary"
              className="flex-1 rounded-xl bg-white border border-zinc-200 shadow-sm hover:bg-zinc-50"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1 rounded-xl shadow-md bg-amber-500 hover:bg-amber-600 border-none"
              isLoading={isLoading}
            >
              Crear {mode === 'multiple' ? 'mesas' : 'mesa'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
