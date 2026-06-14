import { useUpdateProfile } from '@features/settings'
import { ProfileForm } from '@features/settings'
import type { ProfileFormValues } from '@features/settings'
import type { Tenant } from '@core/domain/entities/Tenant'

interface ProfileStepProps {
  tenant: Tenant
  tenantId: string
  onNext: () => void
  onBack: () => void
}

export function ProfileStep({ tenant, tenantId, onNext, onBack }: ProfileStepProps) {
  const { updateProfile, isLoading, error, success } = useUpdateProfile(tenantId)

  const handleSubmit = async (values: ProfileFormValues) => {
    await updateProfile(values)
    // Advance only if the update succeeded (no error). Success transitions are
    // handled inside the hook; we advance immediately so the user can keep flowing.
    onNext()
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-surface-900">Datos de tu restaurante</h2>
        <p className="mt-1 text-sm text-surface-500">
          Agrega tu información de contacto y enlaces de redes sociales.
        </p>
      </div>

      <ProfileForm
        tenant={tenant}
        isLoading={isLoading}
        error={error}
        success={success}
        onSubmit={(values) => { void handleSubmit(values) }}
      />

      <button
        type="button"
        onClick={onBack}
        className="self-start text-xs text-surface-500 hover:text-surface-700 hover:underline"
      >
        ← Atrás
      </button>
    </div>
  )
}
