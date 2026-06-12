import { useState } from 'react'
import { Search } from 'lucide-react'

interface LoyaltyScannerProps {
  readonly onSearch: (phone: string) => void
  readonly isSearching: boolean
}

const SCANNER_COPY = {
  placeholder: 'Teléfono del cliente…',
  search: 'Buscar',
  searching: 'Buscando…',
} as const

/** Buscador de tarjetas por teléfono — el "escáner" del mostrador. */
export function LoyaltyScanner({ onSearch, isSearching }: LoyaltyScannerProps) {
  const [phone, setPhone] = useState('')

  function handleSearch(): void {
    if (phone.trim()) onSearch(phone.trim())
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
          placeholder={SCANNER_COPY.placeholder}
          className="w-full rounded-2xl border border-black/[0.08] bg-white py-3 pl-10 pr-4 text-sm font-semibold text-neutral-800 shadow-sm outline-none placeholder:font-normal focus:border-neutral-400"
        />
      </div>
      <button
        type="button"
        disabled={isSearching || !phone.trim()}
        onClick={handleSearch}
        className="shrink-0 rounded-2xl bg-neutral-900 px-5 py-3 text-[13px] font-black text-white transition-all hover:bg-neutral-700 active:scale-95 disabled:opacity-40"
      >
        {isSearching ? SCANNER_COPY.searching : SCANNER_COPY.search}
      </button>
    </div>
  )
}
