/**
 * Beeps con Web Audio API — sin archivos de audio externos.
 * Usado por KDS, dashboard y notificaciones cuando llega un evento nuevo.
 */

const BEEP_VOLUME = 0.8
const BEEP_DURATION_MS = 350
const BEEP_GAP_MS = 200
const BEEP_FREQUENCIES = [880, 1175, 1760] as const

let sharedContext: AudioContext | null = null

function getContext(): AudioContext | null {
  try {
    if (!sharedContext) sharedContext = new AudioContext()
    if (sharedContext.state === 'suspended') void sharedContext.resume()
    return sharedContext
  } catch (error) {
    // Sin soporte de Web Audio (o bloqueado por el navegador): silencio.
    void error
    return null
  }
}

function playTone(ctx: AudioContext, frequency: number, startAt: number, durationMs: number): void {
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = 'triangle'
  oscillator.frequency.value = frequency
  gain.gain.setValueAtTime(0, startAt)
  gain.gain.linearRampToValueAtTime(BEEP_VOLUME, startAt + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + durationMs / 1000)
  oscillator.connect(gain)
  gain.connect(ctx.destination)
  oscillator.start(startAt)
  oscillator.stop(startAt + durationMs / 1000 + 0.05)
}

/** Doble beep ascendente — pedido/evento nuevo. */
export function playNewOrderBeep(): void {
  const ctx = getContext()
  if (!ctx) return
  const now = ctx.currentTime
  BEEP_FREQUENCIES.forEach((freq, i) => {
    playTone(ctx, freq, now + (i * (BEEP_DURATION_MS + BEEP_GAP_MS)) / 1000, BEEP_DURATION_MS)
  })
}

/** Beep simple — notificación genérica. */
export function playNotificationBeep(): void {
  const ctx = getContext()
  if (!ctx) return
  playTone(ctx, BEEP_FREQUENCIES[0], ctx.currentTime, BEEP_DURATION_MS)
}

/** Síntesis de voz dinámica */
export function speakNewOrder(text: string): void {
  try {
    if (!('speechSynthesis' in window)) return
    // Cancelar cualquier discurso previo para que la alerta sea inmediata
    window.speechSynthesis.cancel()
    
    const msg = new SpeechSynthesisUtterance(text)
    msg.lang = 'es-ES'
    msg.rate = 1.05
    msg.pitch = 1.0
    msg.volume = 1.0
    
    window.speechSynthesis.speak(msg)
  } catch (error) {
    // Si la API falla silenciosamente, ignoramos el error.
    void error
  }
}
