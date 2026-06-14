// "Ver como" — el superadmin entra al panel de un restaurante para inspeccionarlo.
// Se guarda en sessionStorage (se limpia al cerrar la pestaña). Solo surte efecto
// si el usuario es superadmin (lo valida TenantProvider).

const KEY = 'platform-admin:impersonate-tenant'

export function getImpersonatedTenantId(): string | null {
  if (typeof sessionStorage === 'undefined') return null
  return sessionStorage.getItem(KEY)
}

export function setImpersonatedTenantId(tenantId: string): void {
  sessionStorage.setItem(KEY, tenantId)
}

export function clearImpersonatedTenantId(): void {
  sessionStorage.removeItem(KEY)
}
