import type { CashSession, CashSessionClose, NewCashSession } from '../entities/CashSession'

export interface ICashSessionRepository {
  create(session: NewCashSession): Promise<CashSession>
  /** Sesión actualmente abierta del tenant (o null si la caja está cerrada). */
  findOpen(tenantId: string): Promise<CashSession | null>
  /** Cierra una sesión: persiste totales, contado, esperado y diferencia. */
  close(tenantId: string, sessionId: string, data: CashSessionClose): Promise<void>
  /** Historial de sesiones (más recientes primero). */
  listRecent(tenantId: string, max: number): Promise<CashSession[]>
}
