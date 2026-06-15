import { useState, useEffect } from 'react'

export type TerminalMode = 'none' | 'pos' | 'kds' | 'cash'

const TERMINAL_KEY = 'menulab_terminal_mode'

export function useTerminalMode() {
  const [mode, setModeState] = useState<TerminalMode>(() => {
    try {
      const stored = window.localStorage.getItem(TERMINAL_KEY)
      if (stored === 'pos' || stored === 'kds' || stored === 'cash') {
        return stored
      }
    } catch {
      // Ignorar errores de localStorage
    }
    return 'none'
  })

  const setMode = (newMode: TerminalMode) => {
    try {
      if (newMode === 'none') {
        window.localStorage.removeItem(TERMINAL_KEY)
      } else {
        window.localStorage.setItem(TERMINAL_KEY, newMode)
      }
    } catch {
      // Ignorar errores de localStorage
    }
    setModeState(newMode)
  }

  // Escuchar cambios en otras pestañas (opcional pero útil)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === TERMINAL_KEY) {
        const newVal = e.newValue
        if (newVal === 'pos' || newVal === 'kds' || newVal === 'cash') {
          setModeState(newVal)
        } else {
          setModeState('none')
        }
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  return { mode, setMode }
}
