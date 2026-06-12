import { useMemo } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { UtensilsCrossed, Check, ArrowLeft } from 'lucide-react'
import { useAuthContext } from '@app/providers/AuthProvider'
import { RegisterForm, GoogleSignInButton, useSignUp } from '@features/auth'
import type { RegisterFormValues } from '@features/auth'
import {
  TEMPLATE_DEFINITIONS,
  TEMPLATE_DEFAULT_BRANDING,
  DEFAULT_TEMPLATE_ID,
} from '@features/templates/registry'
import type { TenantBrandingSeed } from '@infrastructure/services/TenantProvisioningService'
import { ROUTES } from '@shared/constants/routes'
import { PLATFORM } from '@shared/constants/brand'
import { Spinner } from '@shared/ui/components/Spinner'

const TEMPLATE_PARAM = 'template'

function brandingSeedFor(templateId: keyof typeof TEMPLATE_DEFAULT_BRANDING): TenantBrandingSeed {
  const branding = TEMPLATE_DEFAULT_BRANDING[templateId]
  return {
    templateId,
    primaryColor: branding.primaryColor,
    backgroundColor: branding.backgroundColor,
    fontFamily: branding.fontFamily,
  }
}

/** Resuelve la plantilla del `?template=`; null si no viene o es inválida. */
function resolveTemplate(rawId: string | null): { seed: TenantBrandingSeed; name: string } | null {
  if (!rawId) return null
  if (!(rawId in TEMPLATE_DEFAULT_BRANDING)) return null

  // safe: el guard `rawId in TEMPLATE_DEFAULT_BRANDING` ya validó que es una key válida
  const templateKey = rawId as keyof typeof TEMPLATE_DEFAULT_BRANDING
  return { seed: brandingSeedFor(templateKey), name: TEMPLATE_DEFINITIONS[templateKey].name }
}

export default function RegisterPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthContext()
  const { registerWithEmail, continueWithGoogle, isLoading, error } = useSignUp()
  const [searchParams] = useSearchParams()

  const selectedTemplate = useMemo(
    () => resolveTemplate(searchParams.get(TEMPLATE_PARAM)),
    [searchParams],
  )

  // Desde cero (sin ?template) → plantilla default; el dueño la cambia luego.
  const brandingSeed: TenantBrandingSeed = selectedTemplate?.seed ?? brandingSeedFor(DEFAULT_TEMPLATE_ID)

  if (!isAuthLoading && isAuthenticated && !isLoading && !error) {
    return <Navigate to={ROUTES.admin.dashboard} replace />
  }

  if (isAuthLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const handleEmailSubmit = (values: RegisterFormValues): void => {
    registerWithEmail(values, brandingSeed).catch(() => undefined)
  }

  const handleGoogle = (): void => {
    continueWithGoogle(brandingSeed).catch(() => undefined)
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-surface-50 p-4">
      <div className="w-full max-w-sm">
        <Link
          to={ROUTES.marketing.landing}
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-surface-500 hover:text-surface-700"
        >
          <ArrowLeft size={14} />
          Volver al inicio
        </Link>

        {/* Logo */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 shadow-lg">
            <UtensilsCrossed size={28} className="text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-surface-900">Crea tu menú digital</h1>
            <p className="mt-0.5 text-sm text-surface-500">
              Gratis y listo en minutos · {PLATFORM.name}
            </p>
          </div>
        </div>

        {/* Plantilla seleccionada */}
        {selectedTemplate && (
          <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <Check size={16} className="shrink-0" />
            <span>
              Plantilla <strong>{selectedTemplate.name}</strong> seleccionada
            </span>
          </div>
        )}

        {/* Card */}
        <div className="rounded-2xl border border-surface-100 bg-surface-0 p-6 shadow-sm">
          <GoogleSignInButton onClick={handleGoogle} isLoading={isLoading} />

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-surface-200" />
            <span className="text-xs font-medium text-surface-400">o con email</span>
            <div className="h-px flex-1 bg-surface-200" />
          </div>

          <RegisterForm onSubmit={handleEmailSubmit} isLoading={isLoading} error={error} />
        </div>

        <p className="mt-6 text-center text-sm text-surface-500">
          ¿Ya tienes cuenta?{' '}
          <Link to={ROUTES.auth.login} className="font-medium text-brand-600 hover:text-brand-700">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
