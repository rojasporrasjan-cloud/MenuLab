import type { ReactNode } from 'react'
import type { Tenant } from '@core/domain/entities/Tenant'
import type { Menu } from '@core/domain/entities/Menu'
import type { Table } from '@core/domain/entities/Table'
import type { DishesGroupedByCategory } from '@core/use-cases/menu/GetActiveDishesUseCase'

export interface MenuTemplateProps {
  tenant: Tenant
  menu: Menu
  table: Table
  groups: DishesGroupedByCategory[]
  tenantId: string
  /** Carrusel de destacados inyectado por MenuPage; se renderiza debajo del Hero. */
  featured?: ReactNode
}

export interface TemplateDefinition {
  id: string
  name: string
  description: string
  tags: string[]
  previewBg: string
  previewAccent: string
  previewStyle: 'dark' | 'light' | 'warm'
}
