import { z } from 'zod'

// ── Query keys ────────────────────────────────────────────────────────────────

// Settings mutate the tenant doc, so we invalidate ['tenant', tenantId]
// (owned by TenantProvider) — no dedicated query key needed here.

// ── Profile schema ────────────────────────────────────────────────────────────

export const profileFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(80),
  timezone: z.string().min(1),
  locale: z.string().min(1),
  whatsapp: z.string().optional(),
  sinpeNumber: z.string().optional(),
  wazeUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  googleMapsUrl: z.string().url('URL inválida').optional().or(z.literal('')),
  hours: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  tiktok: z.string().optional(),
})

export type ProfileFormValues = z.infer<typeof profileFormSchema>

// ── Branding schema ────────────────────────────────────────────────────────────

export const brandingFormSchema = z.object({
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color hexadecimal inválido (ej: #e85d04)'),
})

export type BrandingFormValues = z.infer<typeof brandingFormSchema>

// ── Static options ─────────────────────────────────────────────────────────────

export const TIMEZONE_OPTIONS = [
  { value: 'America/Costa_Rica', label: 'Costa Rica (UTC−6)' },
  { value: 'America/Mexico_City', label: 'México (UTC−6)' },
  { value: 'America/Bogota', label: 'Colombia (UTC−5)' },
  { value: 'America/Lima', label: 'Perú (UTC−5)' },
  { value: 'America/Caracas', label: 'Venezuela (UTC−4)' },
  { value: 'America/Santiago', label: 'Chile (UTC−3/−4)' },
  { value: 'America/Sao_Paulo', label: 'Brasil (UTC−3)' },
  { value: 'America/Buenos_Aires', label: 'Argentina (UTC−3)' },
  { value: 'America/New_York', label: 'Nueva York (UTC−5/−4)' },
  { value: 'America/Los_Angeles', label: 'Los Ángeles (UTC−8/−7)' },
  { value: 'Europe/Madrid', label: 'España (UTC+1/+2)' },
] as const

export const LOCALE_OPTIONS = [
  { value: 'es-CR', label: 'Español (Costa Rica)' },
  { value: 'es-MX', label: 'Español (México)' },
  { value: 'es-ES', label: 'Español (España)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'pt-BR', label: 'Português (Brasil)' },
] as const

// Branding tab intentionally removed — appearance lives in `/admin/appearance`
// (single source of truth for the 20+ branding fields on Tenant).
export type SettingsTab = 'profile' | 'commerce' | 'plan' | 'employees'
