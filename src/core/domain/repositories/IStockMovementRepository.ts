import type { NewStockMovement, StockMovement } from '../entities/StockMovement'

export interface IStockMovementRepository {
  /**
   * Registra el movimiento y ajusta atómicamente el stock del ingrediente
   * (la cantidad ya llega con signo normalizado por el use-case).
   */
  create(movement: NewStockMovement): Promise<void>
  /** Últimos movimientos del tenant; opcionalmente de un ingrediente concreto. */
  list(tenantId: string, ingredientId: string | null, max: number): Promise<StockMovement[]>
}
