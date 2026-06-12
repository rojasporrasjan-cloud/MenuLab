import { FirestoreSubscriptionRepository } from '@infrastructure/repositories/FirestoreSubscriptionRepository'
import { GetSubscriptionUseCase } from '@core/use-cases/billing/GetSubscriptionUseCase'

/**
 * Composition root del feature de billing.
 * Singleton a nivel de módulo — mismo patrón que OrderService.
 */
const subscriptionRepository = new FirestoreSubscriptionRepository()

export const BillingService = {
  getSubscription: new GetSubscriptionUseCase(subscriptionRepository),
} as const
