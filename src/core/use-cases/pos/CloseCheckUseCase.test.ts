import { describe, it, expect } from 'vitest'
import { CloseCheckUseCase } from './CloseCheckUseCase'
import { ValidationError } from '@core/errors/ValidationError'
import type { IOrderRepository } from '@core/domain/repositories/IOrderRepository'
import type { IPaymentRepository } from '@core/domain/repositories/IPaymentRepository'
import type { Order } from '@core/domain/entities/Order'
import type { NewPayment, Payment } from '@core/domain/entities/Payment'

// safe (test): fixture mínimo — el use-case solo usa order.id/subtotal/currency.
function order(id: string, subtotal: number): Order {
  return { id, tenantId: 't1', subtotal, currency: 'CRC' } as unknown as Order
}

function makeUseCase() {
  const statusUpdates: string[] = []
  const created: NewPayment[] = []
  const orderRepo = {
    updateStatus: async (_t: string, id: string) => { statusUpdates.push(id) },
  } as unknown as IOrderRepository
  const paymentRepo = {
    create: async (p: NewPayment): Promise<Payment> => {
      created.push(p)
      return { ...p, id: `pay-${created.length}`, createdAt: new Date() }
    },
  } as unknown as IPaymentRepository
  return { useCase: new CloseCheckUseCase(orderRepo, paymentRepo), statusUpdates, created }
}

describe('CloseCheckUseCase', () => {
  it('cobra cada pedido, calcula total y vuelto, y los marca entregados', async () => {
    const { useCase, statusUpdates, created } = makeUseCase()
    const result = await useCase.execute({
      tenantId: 't1', orders: [order('o1', 3000), order('o2', 2000)],
      method: 'cash', reference: null, cashGiven: 6000, createdBy: 'caja',
    })
    expect(result.total).toBe(5000)
    expect(result.cashChange).toBe(1000) // 6000 - 5000
    expect(result.payments).toHaveLength(2)
    expect(created[0]?.cashGiven).toBe(6000) // efectivo/vuelto en el primer pago
    expect(created[1]?.cashGiven).toBeNull()
    expect(statusUpdates).toEqual(['o1', 'o2'])
  })

  it('rechaza si el efectivo no cubre el total', async () => {
    const { useCase } = makeUseCase()
    await expect(useCase.execute({
      tenantId: 't1', orders: [order('o1', 5000)],
      method: 'cash', reference: null, cashGiven: 3000, createdBy: 'caja',
    })).rejects.toBeInstanceOf(ValidationError)
  })

  it('rechaza cuando no hay pedidos', async () => {
    const { useCase } = makeUseCase()
    await expect(useCase.execute({
      tenantId: 't1', orders: [], method: 'card', reference: null, cashGiven: null, createdBy: 'caja',
    })).rejects.toBeInstanceOf(ValidationError)
  })

  it('pago con tarjeta no calcula vuelto', async () => {
    const { useCase } = makeUseCase()
    const result = await useCase.execute({
      tenantId: 't1', orders: [order('o1', 5000)],
      method: 'card', reference: 'voucher-123', cashGiven: null, createdBy: 'caja',
    })
    expect(result.cashChange).toBeNull()
    expect(result.total).toBe(5000)
  })
})
