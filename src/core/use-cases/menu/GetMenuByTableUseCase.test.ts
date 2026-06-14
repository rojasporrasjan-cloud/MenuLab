import { describe, it, expect } from 'vitest'
import { GetMenuByTableUseCase } from './GetMenuByTableUseCase'
import type { ITableRepository } from '@core/domain/repositories/ITableRepository'
import type { IMenuRepository } from '@core/domain/repositories/IMenuRepository'
import type { Menu } from '@core/domain/entities/Menu'
import type { Table } from '@core/domain/entities/Table'

describe('GetMenuByTableUseCase', () => {
  it('resuelve la mesa y luego su menú (por table.menuId)', async () => {
    const table = { id: 'mesa-1', menuId: 'm1' } as unknown as Table
    const menu = { id: 'm1', name: 'Principal' } as unknown as Menu

    let requestedMenuId = ''
    // safe (test): fakes mínimos — solo se llama getById.
    const tableRepo = { getById: async () => table } as unknown as ITableRepository
    const menuRepo = {
      getById: async (_tenantId: string, id: string) => { requestedMenuId = id; return menu },
    } as unknown as IMenuRepository

    const result = await new GetMenuByTableUseCase(tableRepo, menuRepo).execute('t1', 'mesa-1')
    expect(result.table.id).toBe('mesa-1')
    expect(result.menu.id).toBe('m1')
    expect(requestedMenuId).toBe('m1') // usó el menuId de la mesa
  })
})
