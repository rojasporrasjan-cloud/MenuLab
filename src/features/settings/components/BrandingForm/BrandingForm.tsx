import { useState, useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@shared/ui/components/Button'
import { ThemePreview } from '@features/theme'
import { ColorPicker } from '../ColorPicker'
import { TenantAssetUpload } from '../TenantAssetUpload'
import { brandingFormSchema } from '../../types/settings.types'
import type { BrandingFormValues } from '../../types/settings.types'
import type { Tenant } from '@core/domain/entities/Tenant'

interface BrandingFormProps {
  tenant: Tenant
  isLoading: boolean
  error: string | null
  success: boolean
  onSubmit: (values: BrandingFormValues, logoFile: File | null, coverFile: File | null) => void
}

export function BrandingForm({
  tenant,
  isLoading,
  error,
  success,
  onSubmit,
}: BrandingFormProps) {
  const [primaryColor, setPrimaryColor] = useState(tenant.branding.primaryColor)
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof BrandingFormValues, string>>
  >({})

  // ── Logo state ──────────────────────────────────────────────────────────────
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(tenant.branding.logoUrl)

  // ── Cover state ─────────────────────────────────────────────────────────────
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(tenant.branding.coverImageUrl)

  // Sincroniza cuando el tenant se recarga (p. ej. después de guardar).
  // Patrón React "adjust state during render": solo resetea previews si no hay
  // archivo local pendiente (preserva la selección sin guardar).
  const [syncedTenant, setSyncedTenant] = useState(tenant)
  if (tenant !== syncedTenant) {
    setSyncedTenant(tenant)
    setPrimaryColor(tenant.branding.primaryColor)
    if (!logoFile) setLogoPreview(tenant.branding.logoUrl)
    if (!coverFile) setCoverPreview(tenant.branding.coverImageUrl)
  }

  // ── Logo handlers ────────────────────────────────────────────────────────────
  const handleLogoSelect = (file: File) => {
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }
  const handleLogoClear = () => {
    setLogoFile(null)
    setLogoPreview(tenant.branding.logoUrl) // revert to saved
  }

  // ── Cover handlers ───────────────────────────────────────────────────────────
  const handleCoverSelect = (file: File) => {
    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }
  const handleCoverClear = () => {
    setCoverFile(null)
    setCoverPreview(tenant.branding.coverImageUrl) // revert to saved
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const result = brandingFormSchema.safeParse({ primaryColor })
    if (!result.success) {
      const errors: Partial<Record<keyof BrandingFormValues, string>> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof BrandingFormValues
        if (!errors[key]) errors[key] = issue.message
      }
      setFieldErrors(errors)
      return
    }
    onSubmit(result.data, logoFile, coverFile)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {/* Primary color */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-surface-700">
          Color principal <span className="text-red-500">*</span>
        </label>
        <ColorPicker
          value={primaryColor}
          onChange={(v) => {
            setPrimaryColor(v)
            if (fieldErrors.primaryColor)
              setFieldErrors((prev) => ({ ...prev, primaryColor: undefined }))
          }}
        />
        {fieldErrors.primaryColor && (
          <p className="text-xs text-red-600">{fieldErrors.primaryColor}</p>
        )}
        <p className="text-xs text-surface-400">
          Se aplica en botones y acentos del menú público.
        </p>

        {/* Live palette preview — derived from the picked color */}
        <div className="mt-2">
          <ThemePreview hex={primaryColor} />
        </div>
      </div>

      {/* Logo */}
      <div className="w-40">
        <TenantAssetUpload
          label="Logo del restaurante"
          hint="PNG · WebP · máx. 2 MB"
          previewUrl={logoPreview}
          uploadProgress={0}
          isUploading={false}
          aspectClass="aspect-square"
          onFileSelect={handleLogoSelect}
          onClear={handleLogoClear}
        />
      </div>

      {/* Cover image */}
      <div className="max-w-sm">
        <TenantAssetUpload
          label="Imagen de portada"
          hint="16:9 · JPG · PNG · WebP · máx. 4 MB"
          previewUrl={coverPreview}
          uploadProgress={0}
          isUploading={false}
          aspectClass="aspect-video"
          onFileSelect={handleCoverSelect}
          onClear={handleCoverClear}
        />
      </div>

      {/* Feedback */}
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle2 size={15} />
          Apariencia guardada correctamente.
        </div>
      )}

      <Button type="submit" isLoading={isLoading} className="self-start px-6">
        Guardar apariencia
      </Button>
    </form>
  )
}
