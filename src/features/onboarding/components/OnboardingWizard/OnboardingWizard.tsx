import { useState } from 'react'
import { useTenantContext } from '@app/providers/TenantProvider'
import { StepIndicator } from '../StepIndicator'
import { WelcomeStep } from '../WelcomeStep'
import { ProfileStep } from '../ProfileStep'
import { BrandingStep } from '../BrandingStep'
import { CompleteStep } from '../CompleteStep'
import { useCompleteOnboarding } from '../../hooks/useCompleteOnboarding'
import { ONBOARDING_STEPS } from '../../types/onboarding.types'
import type { OnboardingStep } from '../../types/onboarding.types'

export function OnboardingWizard() {
  const { tenant, tenantId } = useTenantContext()
  const [step, setStep] = useState<OnboardingStep>('welcome')
  const { completeOnboarding, isLoading, error } = useCompleteOnboarding(tenantId)

  // Should never render without a tenant — parent decides
  if (!tenant) return null

  const goNext = () => {
    const idx = ONBOARDING_STEPS.indexOf(step)
    const next = ONBOARDING_STEPS[idx + 1]
    if (next) setStep(next)
  }

  const goBack = () => {
    const idx = ONBOARDING_STEPS.indexOf(step)
    const prev = ONBOARDING_STEPS[idx - 1]
    if (prev) setStep(prev)
  }

  const handleFinish = () => {
    void completeOnboarding()
  }

  const handleSkip = () => {
    void completeOnboarding()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="relative my-8 flex w-full max-w-xl flex-col gap-6 rounded-3xl bg-surface-0 p-6 shadow-2xl sm:p-8">

        {/* Top progress */}
        <header className="flex items-center justify-between gap-4">
          <h1 id="onboarding-title" className="sr-only">
            Configuración inicial
          </h1>
          <StepIndicator activeStep={step} />
        </header>

        {/* Step content */}
        <div>
          {step === 'welcome' && (
            <WelcomeStep
              tenant={tenant}
              onNext={goNext}
              onSkip={handleSkip}
              isSkipping={isLoading}
            />
          )}
          {step === 'profile' && (
            <ProfileStep
              tenant={tenant}
              tenantId={tenantId}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 'branding' && (
            <BrandingStep
              tenant={tenant}
              tenantId={tenantId}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 'complete' && (
            <CompleteStep
              tenantId={tenantId}
              tenantName={tenant.name}
              isLoading={isLoading}
              error={error}
              onFinish={handleFinish}
              onBack={goBack}
            />
          )}
        </div>
      </div>
    </div>
  )
}
