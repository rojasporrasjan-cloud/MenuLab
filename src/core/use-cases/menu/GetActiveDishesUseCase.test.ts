import { describe, it, expect } from 'vitest'
import { GetActiveDishesUseCase } from './GetActiveDishesUseCase'
import type { IDishRepository } from '@core/domain/repositories/IDishRepository'
import type { ICategoryRepository } from '@core/domain/repositories/ICategoryRepository'
import type { Dish } from '@core/domain/entities/Dish'
import type { Category } from '@core/domain/entities/Category'

// safe (test): fixtures mínimos — el use-case solo lee dish.id/categoryId y category.id.
function dish(id: string, categoryId: string): Dish {
  return { id, categoryId } as unknown as Dish
}
function category(id: string): Category {
  return { id, name: id } as unknown as Category
}

function makeUseCase(dishes: Dish[], categories: Category[]): GetActiveDishesUseCase {
  // safe (test): fakes mínimos — el use-case solo llama getByMenuId.
  const dishRepo = { getByMenuId: async () => dishes } as unknown as IDishRepository
  const categoryRepo = { getByMenuId: async () => categories } as unknown as ICategoryRepository
  return new GetActiveDishesUseCase(dishRepo, categoryRepo)
}

describe('GetActiveDishesUseCase', () => {
  it('agrupa platos por categoría respetando categoryOrder', async () => {
    const groups = await makeUseCase(
      [dish('d1', 'cat-a'), dish('d2', 'cat-b'), dish('d3', 'cat-a')],
      [category('cat-a'), category('cat-b')],
    ).execute('t1', 'm1', ['cat-b', 'cat-a'])
    expect(groups.map((g) => g.category.id)).toEqual(['cat-b', 'cat-a'])
    expect(groups[1]?.dishes.map((d) => d.id)).toEqual(['d1', 'd3'])
  })

  it('omite categorías sin platos', async () => {
    const groups = await makeUseCase(
      [dish('d1', 'cat-a')],
      [category('cat-a'), category('cat-b')],
    ).execute('t1', 'm1', ['cat-a', 'cat-b'])
    expect(groups.map((g) => g.category.id)).toEqual(['cat-a'])
  })

  it('usa el orden natural de categorías cuando categoryOrder está vacío', async () => {
    const groups = await makeUseCase(
      [dish('d1', 'cat-a'), dish('d2', 'cat-b')],
      [category('cat-b'), category('cat-a')],
    ).execute('t1', 'm1', [])
    expect(groups.map((g) => g.category.id)).toEqual(['cat-b', 'cat-a'])
  })
})
