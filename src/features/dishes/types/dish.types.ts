import { z } from 'zod'
import type { DishStatus }        from '@core/domain/entities/Dish'
import type { DishVariantGroup }  from '@core/domain/entities/Dish'

// ── Query keys ────────────────────────────────────────────────────────────────

export const dishQueryKeys = {
  all:        (tenantId: string)                              => ['dishes', tenantId] as const,
  byMenu:     (tenantId: string, menuId: string)              => ['dishes', tenantId, menuId] as const,
  detail:     (tenantId: string, menuId: string, dishId: string) =>
                ['dishes', tenantId, menuId, dishId] as const,
  menus:      (tenantId: string)                              => ['admin-menus', tenantId] as const,
  categories: (tenantId: string, menuId: string)              =>
                ['admin-categories', tenantId, menuId] as const,
}

// ── Zod schema ────────────────────────────────────────────────────────────────

export const dishFormSchema = z.object({
  name:           z.string().min(1, 'El nombre es requerido').max(100),
  description:    z.string().max(500).optional(),
  priceAmount:    z.string()
                    .min(1, 'El precio es requerido')
                    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, 'Precio inválido'),
  priceCurrency:  z.string().default('CRC'),
  categoryId:     z.string().optional(),
  status:         z.enum(['available', 'unavailable', 'seasonal']),
  isVegetarian:   z.boolean(),
  isVegan:        z.boolean(),
  isGlutenFree:   z.boolean(),
  tags:           z.string(),
  allergens:      z.string(),
  calories:       z.string().optional(),
  featured:       z.boolean(),
})

export type DishFormSchemaValues = z.infer<typeof dishFormSchema>

// DishFormValues extends the schema with the non-Zod variant groups field
export interface DishFormValues extends DishFormSchemaValues {
  variantGroups: DishVariantGroup[]
}

// ── Default form state ────────────────────────────────────────────────────────

export const defaultDishFormValues: DishFormValues = {
  name:          '',
  description:   '',
  priceAmount:   '',
  priceCurrency: 'CRC',
  categoryId:    '',
  status:        'available' as DishStatus,
  isVegetarian:  false,
  isVegan:       false,
  isGlutenFree:  false,
  tags:          '',
  allergens:     '',
  calories:      '',
  featured:      false,
  variantGroups: [],
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function tagsFromString(raw: string): string[] {
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}
