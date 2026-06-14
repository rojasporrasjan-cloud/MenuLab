import { describe, it, expect } from 'vitest'
import { selectFeaturedDishes } from './Dish'
import type { Dish } from './Dish'

// Fixture mínimo: selectFeaturedDishes solo lee id/featured/status/featuredRank.
// safe (test): el resto del Dish (price/assets/nutrition/variantGroups) no influye
// en esta función pura, así que se omite del fixture.
function dish(id: string, featured: boolean, status: Dish['status'], featuredRank: number | null): Dish {
  return { id, featured, status, featuredRank } as unknown as Dish
}

describe('selectFeaturedDishes', () => {
  it('devuelve solo destacados disponibles, ordenados por rank', () => {
    const dishes = [
      dish('c', true, 'available', 3),
      dish('a', true, 'available', 1),
      dish('b', true, 'available', 2),
    ]
    expect(selectFeaturedDishes(dishes, 10).map((d) => d.id)).toEqual(['a', 'b', 'c'])
  })

  it('excluye no destacados y no disponibles', () => {
    const dishes = [
      dish('feat', true, 'available', 1),
      dish('notFeat', false, 'available', 0),
      dish('unavail', true, 'unavailable', 0),
    ]
    expect(selectFeaturedDishes(dishes, 10).map((d) => d.id)).toEqual(['feat'])
  })

  it('respeta el máximo', () => {
    const dishes = [
      dish('a', true, 'available', 1),
      dish('b', true, 'available', 2),
      dish('c', true, 'available', 3),
    ]
    expect(selectFeaturedDishes(dishes, 2).map((d) => d.id)).toEqual(['a', 'b'])
  })

  it('rank null va al final', () => {
    const dishes = [
      dish('noRank', true, 'available', null),
      dish('ranked', true, 'available', 1),
    ]
    expect(selectFeaturedDishes(dishes, 10).map((d) => d.id)).toEqual(['ranked', 'noRank'])
  })
})
