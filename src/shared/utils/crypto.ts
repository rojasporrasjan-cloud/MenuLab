/**
 * Utilidades criptográficas para hashing seguro de PINs usando PBKDF2.
 * Si Web Crypto API no está disponible (ej. red local sin HTTPS), usa un fallback inseguro solo para desarrollo.
 */

// Helper: array buffer to hex
function buf2hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Helper: hex to array buffer
function hex2buf(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(Math.ceil(hex.length / 2))
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return bytes.buffer
}

const ITERATIONS = 100000
const KEY_LEN = 32 // 256 bits

async function getPbkdf2Hash(password: string, saltBuffer: ArrayBuffer): Promise<string> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    KEY_LEN * 8
  )

  return buf2hex(derivedBits)
}

/**
 * Genera un hash seguro para un PIN usando PBKDF2 con un salt aleatorio.
 * Retorna en formato "saltHex:hashHex".
 */
export async function hashPin(pin: string): Promise<string> {
  if (!crypto.subtle) {
    console.warn("crypto.subtle is unavailable (insecure context). Using fallback hashing for local testing.")
    let hash = 0
    for (let i = 0; i < pin.length; i++) {
      hash = ((hash << 5) - hash) + pin.charCodeAt(i)
      hash |= 0 // Convert to 32bit integer
    }
    const fakeHash = Math.abs(hash).toString(16).padStart(64, '0')
    return `fallback:${fakeHash}`
  }

  const saltBuffer = crypto.getRandomValues(new Uint8Array(16)).buffer
  const saltHex = buf2hex(saltBuffer)
  const hashHex = await getPbkdf2Hash(pin, saltBuffer)
  
  return `${saltHex}:${hashHex}`
}

/**
 * Verifica un PIN contra un storedHash en formato "saltHex:hashHex"
 */
export async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  if (storedHash.startsWith('fallback:')) {
    // Modo fallback local
    let hash = 0
    for (let i = 0; i < pin.length; i++) {
      hash = ((hash << 5) - hash) + pin.charCodeAt(i)
      hash |= 0
    }
    const fakeHash = Math.abs(hash).toString(16).padStart(64, '0')
    return storedHash === `fallback:${fakeHash}`
  }

  // Compatibilidad hacia atrás con el SHA-256 plano viejo (si no tiene ':')
  if (!storedHash.includes(':')) {
    if (!crypto.subtle) return false // No podemos verificar hashes viejos sin crypto.subtle
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pin))
    const oldHash = buf2hex(buf)
    return oldHash === storedHash
  }

  if (!crypto.subtle) {
    console.warn("No crypto.subtle available to verify real PBKDF2 hash.")
    return false
  }

  const [saltHex, originalHashHex] = storedHash.split(':')
  const saltBuffer = hex2buf(saltHex)
  
  const attemptHashHex = await getPbkdf2Hash(pin, saltBuffer)
  return attemptHashHex === originalHashHex
}
