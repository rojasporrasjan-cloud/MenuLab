import { useState } from 'react'
import { Lock, Unlock } from 'lucide-react'
import { useTerminalMode, type TerminalMode } from '@shared/hooks/useTerminalMode'
import { RequirePin } from '@app/router/RequirePin'

interface TerminalLockButtonProps {
  readonly modeToSet: TerminalMode
}

export function TerminalLockButton({ modeToSet }: TerminalLockButtonProps) {
  const { mode, setMode } = useTerminalMode()
  const [showUnlockAuth, setShowUnlockAuth] = useState(false)

  const isLocked = mode === modeToSet

  const handleToggle = () => {
    if (isLocked) {
      setShowUnlockAuth(true)
    } else {
      // Pedimos confirmación nativa para evitar clicks accidentales
      if (window.confirm('¿Deseas fijar este dispositivo como terminal? El panel de administrador se bloqueará.')) {
        setMode(modeToSet)
      }
    }
  }

  if (showUnlockAuth) {
    return (
      <RequirePin
        onSuccess={() => {
          setMode('none')
          setShowUnlockAuth(false)
        }}
        onCancel={() => setShowUnlockAuth(false)}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`group inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-bold transition-all ring-1 ${
        isLocked 
          ? 'bg-rose-500/10 text-rose-400 ring-rose-500/20 hover:bg-rose-500/20' 
          : 'bg-white/5 text-neutral-300 ring-white/10 hover:bg-white/10 hover:text-white hover:ring-white/20'
      }`}
    >
      {isLocked ? (
        <>
          <Lock size={14} className="text-rose-400" />
          <span>Terminal Fijada</span>
        </>
      ) : (
        <>
          <Unlock size={14} className="text-neutral-400 group-hover:text-white" />
          <span>Fijar Terminal</span>
        </>
      )}
    </button>
  )
}
