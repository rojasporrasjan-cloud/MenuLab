import { useState, useEffect } from 'react'

const MODEL_VIEWER_CDN =
  'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js'

const SCRIPT_ATTR = 'data-model-viewer-loaded'

type ScriptState = 'idle' | 'loading' | 'ready' | 'error'

/**
 * Injects the model-viewer CDN script once per page session.
 * Re-renders that call this hook reuse the same singleton script element.
 */
export function useARLoader() {
  const getInitialState = (): ScriptState => {
    if (typeof document === 'undefined') return 'idle'
    const existing = document.querySelector(`script[${SCRIPT_ATTR}]`)
    if (!existing) return 'idle'
    return existing.getAttribute(SCRIPT_ATTR) === 'ready' ? 'ready' : 'loading'
  }

  const [state, setState] = useState<ScriptState>(getInitialState)

  useEffect(() => {
    if (state === 'ready') return

    const existing = document.querySelector(`script[${SCRIPT_ATTR}]`)

    if (existing) {
      // Script is being injected by another instance — wait for it
      const onReady = () => setState('ready')
      const onError = () => setState('error')
      existing.addEventListener('load', onReady)
      existing.addEventListener('error', onError)
      return () => {
        existing.removeEventListener('load', onReady)
        existing.removeEventListener('error', onError)
      }
    }

    // No hay setState síncrono aquí: para los consumidores 'idle' y 'loading'
    // son equivalentes (solo exponen isReady/isError); el estado avanza en onload/onerror.
    const script = document.createElement('script')
    script.type = 'module'
    script.src = MODEL_VIEWER_CDN
    script.setAttribute(SCRIPT_ATTR, 'loading')
    script.onload = () => {
      script.setAttribute(SCRIPT_ATTR, 'ready')
      setState('ready')
    }
    script.onerror = () => {
      script.setAttribute(SCRIPT_ATTR, 'error')
      setState('error')
    }

    document.head.appendChild(script)
  }, [state])

  return {
    isReady: state === 'ready',
    isLoading: state === 'loading' || state === 'idle',
    isError: state === 'error',
  }
}
