import type { Subscription } from '@core/domain/entities/Subscription'
import type { ISubscriptionRepository } from '@core/domain/repositories/ISubscriptionRepository'

export class GetSubscriptionUseCase {
  private readonly subscriptionRepository: ISubscriptionRepository

  constructor(subscriptionRepository: ISubscriptionRepository) {
    this.subscriptionRepository = subscriptionRepository
  }

  async execute(tenantId: string): Promise<Subscription | null> {
    if (!tenantId) return null
    return this.subscriptionRepository.getByTenantId(tenantId)
  }
}
