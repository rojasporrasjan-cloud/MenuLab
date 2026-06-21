/**
 * SHA-256 hex con Web Crypto API.
 * Único punto de hashing de PINs (settings, POS, empleados).
 */
export async function sha256(text: string): Promise<string> {
  // Safari/Chrome on mobile block crypto.subtle on local network IPs (e.g. 192.168.x.x)
  // because it's not HTTPS or localhost. We use a fallback for local testing.
  if (!crypto.subtle) {
    console.warn("crypto.subtle is unavailable (insecure context). Using fallback hashing for local testing.")
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i)
      hash |= 0 // Convert to 32bit integer
    }
    // Return a hex string padded to look somewhat like a real hash
    return Math.abs(hash).toString(16).padStart(64, '0')
  }

  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
