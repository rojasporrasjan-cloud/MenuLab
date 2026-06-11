import { Menu, Bell, ExternalLink, Search, Globe } from 'lucide-react'
import { Link }                from 'react-router-dom'
import { cn }                  from '@shared/utils/cn'
import { useTenantContext }    from '@app/providers/TenantProvider'

interface TopbarProps {
  readonly onMenuToggle: () => void
  readonly title?:       string
  readonly className?:   string
}

export function Topbar({ onMenuToggle, title, className }: TopbarProps) {
  const { tenantId } = useTenantContext()

  return (
    <header
      className={cn(
        'flex h-[54px] shrink-0 items-center gap-3',
        'border-b px-4 lg:px-6',
        className,
      )}
      style={{
        background:   'rgba(250,249,247,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderColor:  '#efede9',
      }}
    >
      {/* Sidebar toggle button (hamburger) */}
      <button
        onClick={onMenuToggle}
        aria-label="Toggle navegación"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
        style={{ color: '#908c85' }}
      >
        <Menu size={17} />
      </button>

      {/* Page title */}
      {title && (
        <h2
          className="truncate text-[14px] font-semibold tracking-[-0.01em]"
          style={{ color: '#17150f' }}
        >
          {title}
        </h2>
      )}

      <div className="flex-1" />

      {/* Actions row */}
      <div className="flex items-center gap-1">

        {/* Search shortcut */}
        <button
          aria-label="Buscar (⌘K)"
          title="Buscar (⌘K)"
          className="hidden items-center gap-2 rounded-lg border px-3 py-1.5 text-[12px] transition-colors sm:flex"
          style={{
            color:       '#a8a49d',
            borderColor: '#efede9',
            background:  'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#dbd8d2'
            e.currentTarget.style.color       = '#73706a'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#efede9'
            e.currentTarget.style.color       = '#a8a49d'
          }}
        >
          <Search size={12} />
          <span>Buscar…</span>
          <span
            className="rounded px-1 py-px text-[10px] font-medium"
            style={{ background: '#efede9', color: '#908c85' }}
          >
            ⌘K
          </span>
        </button>

        {/* Divider */}
        <div className="mx-1 h-4 w-px" style={{ background: '#efede9' }} />

        {/* Ver menú CTA */}
        {tenantId && (
          <Link
            to={`/${tenantId}/menu`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all"
            style={{
              background: 'linear-gradient(135deg, #e99a0e 0%, #cc7809 100%)',
              color:      '#ffffff',
              boxShadow:  '0 1px 3px rgba(233,154,14,0.4), 0 0 0 1px rgba(233,154,14,0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(233,154,14,0.5), 0 0 0 1px rgba(233,154,14,0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(233,154,14,0.4), 0 0 0 1px rgba(233,154,14,0.2)'
            }}
          >
            <Globe size={12} />
            <span>Ver menú</span>
            <ExternalLink size={10} style={{ opacity: 0.7 }} />
          </Link>
        )}

        {/* Notifications */}
        <button
          aria-label="Notificaciones"
          className="relative flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
          style={{ color: '#a8a49d' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color      = '#57544f'
            e.currentTarget.style.background = '#efede9'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color      = '#a8a49d'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <Bell size={15} />
          {/* Unread dot */}
          <span
            className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
            style={{ background: '#e99a0e' }}
          />
        </button>

      </div>
    </header>
  )
}
