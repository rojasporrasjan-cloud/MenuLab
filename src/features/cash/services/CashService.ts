import { FirestoreCashSessionRepository } from '@infrastructure/repositories/FirestoreCashSessionRepository'
import { FirestorePaymentRepository } from '@infrastructure/repositories/FirestorePaymentRepository'
import { OpenCashSessionUseCase } from '@core/use-cases/cash/OpenCashSessionUseCase'
import { CloseCashSessionUseCase } from '@core/use-cases/cash/CloseCashSessionUseCase'
import { GetOpenCashSessionUseCase } from '@core/use-cases/cash/GetOpenCashSessionUseCase'
import { ListCashSessionsUseCase } from '@core/use-cases/cash/ListCashSessionsUseCase'

/** Composition root del cierre de caja — mismo patrón que OrderService. */
const cashSessionRepository = new FirestoreCashSessionRepository()
const paymentRepository = new FirestorePaymentRepository()

export const CashService = {
  open: new OpenCashSessionUseCase(cashSessionRepository),
  close: new CloseCashSessionUseCase(cashSessionRepository, paymentRepository),
  getOpen: new GetOpenCashSessionUseCase(cashSessionRepository),
  list: new ListCashSessionsUseCase(cashSessionRepository),
} as const
