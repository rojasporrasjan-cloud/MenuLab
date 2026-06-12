import type { IMenuRepository } from '@core/domain/repositories/IMenuRepository'
import type { IDishRepository } from '@core/domain/repositories/IDishRepository'
import type { ICategoryRepository } from '@core/domain/repositories/ICategoryRepository'
import type { ITableRepository } from '@core/domain/repositories/ITableRepository'
import type { Menu } from '@core/domain/entities/Menu'
import type { Dish } from '@core/domain/entities/Dish'
import type { Category } from '@core/domain/entities/Category'
import type { Table } from '@core/domain/entities/Table'
import { NotFoundError } from '@core/errors/NotFoundError'

const MOCK_CATEGORIES: Category[] = [
  {
    id: 'destacados',
    tenantId: 'soda-la-rustica',
    menuId: 'menu-principal',
    name: '⭐ Destacados de la Casa',
    description: 'Nuestras mejores especialidades con vista interactiva en 3D.',
    imageUrl: null,
    sortOrder: 0,
  },
  {
    id: 'pizzas',
    tenantId: 'soda-la-rustica',
    menuId: 'menu-principal',
    name: 'Pizzas Artesanales',
    description: 'Pizzas al horno de piedra con masa madre',
    imageUrl: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=600',
    sortOrder: 1,
  },
  {
    id: 'pastas',
    tenantId: 'soda-la-rustica',
    menuId: 'menu-principal',
    name: 'Pastas Caseras',
    description: 'Pasta fresca hecha a mano diariamente',
    imageUrl: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600',
    sortOrder: 2,
  },
  {
    id: 'bebidas',
    tenantId: 'soda-la-rustica',
    menuId: 'menu-principal',
    name: 'Bebidas y Cocteles',
    description: 'Refrescantes bebidas naturales y artesanales',
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600',
    sortOrder: 3,
  },
  {
    id: 'postres',
    tenantId: 'soda-la-rustica',
    menuId: 'menu-principal',
    name: 'Postres',
    description: 'Finales dulces para tu comida',
    imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600',
    sortOrder: 4,
  },
]

const MOCK_DISHES: Dish[] = [
  // Destacados
  {
    id: 'pizza-margherita-destacada',
    tenantId: 'soda-la-rustica',
    menuId: 'menu-principal',
    categoryId: 'destacados',
    name: 'Pizza Margherita',
    description: 'Salsa de tomate de la casa, mozzarella fresca, albahaca orgánica y un toque de aceite de oliva extra virgen.',
    price: { amount: 5500, currency: 'CRC' },
    status: 'available',
    assets: {
      imageUrl: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=600',
      thumbnailUrl: null,
      modelGlbUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
      modelUsdzUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.usdz',
      hasAR: true,
    },
    nutrition: {
      calories: 850,
      allergens: ['Gluten', 'Lácteos'],
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: false,
    },
    tags: ['Clásica', 'Más Vendida'],
    variantGroups: [],
    featured: false,
    featuredRank: null,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'pizza-la-rustica-destacada',
    tenantId: 'soda-la-rustica',
    menuId: 'menu-principal',
    categoryId: 'destacados',
    name: 'Pizza La Rústica',
    description: 'Nuestra especialidad: salsa de tomate de la casa, mozzarella, prosciutto italiano, rúcula fresca y lascas de queso parmesano con reducción de vinagre balsámico.',
    price: { amount: 7500, currency: 'CRC' },
    status: 'available',
    assets: {
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600',
      thumbnailUrl: null,
      modelGlbUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
      modelUsdzUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.usdz',
      hasAR: true,
    },
    nutrition: {
      calories: 980,
      allergens: ['Gluten', 'Lácteos'],
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
    },
    tags: ['Recomendación', 'Firma'],
    variantGroups: [],
    featured: false,
    featuredRank: null,
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'tiramisu-destacado',
    tenantId: 'soda-la-rustica',
    menuId: 'menu-principal',
    categoryId: 'destacados',
    name: 'Tiramisú Clásico',
    description: 'Postre italiano tradicional preparado con bizcochos de soletilla bañados en café espresso fuerte y licor Amaretto, cubierto con una sedosa crema de queso mascarpone y cacao espolvoreado.',
    price: { amount: 3500, currency: 'CRC' },
    status: 'available',
    assets: {
      imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600',
      thumbnailUrl: null,
      modelGlbUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
      modelUsdzUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.usdz',
      hasAR: true,
    },
    nutrition: {
      calories: 450,
      allergens: ['Gluten', 'Lácteos', 'Huevo'],
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: false,
    },
    tags: ['Postre', 'Favorito'],
    variantGroups: [],
    featured: false,
    featuredRank: null,
    sortOrder: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Pizzas
  {
    id: 'pizza-margherita',
    tenantId: 'soda-la-rustica',
    menuId: 'menu-principal',
    categoryId: 'pizzas',
    name: 'Pizza Margherita',
    description: 'Salsa de tomate de la casa, mozzarella fresca, albahaca orgánica y un toque de aceite de oliva extra virgen.',
    price: { amount: 5500, currency: 'CRC' },
    status: 'available',
    assets: {
      imageUrl: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=600',
      thumbnailUrl: null,
      modelGlbUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
      modelUsdzUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.usdz',
      hasAR: true,
    },
    nutrition: {
      calories: 850,
      allergens: ['Gluten', 'Lácteos'],
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: false,
    },
    tags: ['Clásica', 'Más Vendida'],
    variantGroups: [],
    featured: false,
    featuredRank: null,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'pizza-la-rustica',
    tenantId: 'soda-la-rustica',
    menuId: 'menu-principal',
    categoryId: 'pizzas',
    name: 'Pizza La Rústica',
    description: 'Nuestra especialidad: salsa de tomate de la casa, mozzarella, prosciutto italiano, rúcula fresca y lascas de queso parmesano con reducción de vinagre balsámico.',
    price: { amount: 7500, currency: 'CRC' },
    status: 'available',
    assets: {
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600',
      thumbnailUrl: null,
      modelGlbUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
      modelUsdzUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.usdz',
      hasAR: true,
    },
    nutrition: {
      calories: 980,
      allergens: ['Gluten', 'Lácteos'],
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
    },
    tags: ['Recomendación', 'Firma'],
    variantGroups: [],
    featured: false,
    featuredRank: null,
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Pastas
  {
    id: 'fettuccine-alfredo',
    tenantId: 'soda-la-rustica',
    menuId: 'menu-principal',
    categoryId: 'pastas',
    name: 'Fettuccine Alfredo',
    description: 'Pasta larga fresca hecha en casa, bañada en una cremosa salsa de mantequilla artesanal y queso parmesano Reggiano.',
    price: { amount: 6200, currency: 'CRC' },
    status: 'available',
    assets: {
      imageUrl: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600',
      thumbnailUrl: null,
      modelGlbUrl: null,
      modelUsdzUrl: null,
      hasAR: false,
    },
    nutrition: {
      calories: 780,
      allergens: ['Gluten', 'Lácteos', 'Huevo'],
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: false,
    },
    tags: ['Pasta Fresca', 'Cremosa'],
    variantGroups: [],
    featured: false,
    featuredRank: null,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'lasagna-boloñesa',
    tenantId: 'soda-la-rustica',
    menuId: 'menu-principal',
    categoryId: 'pastas',
    name: 'Lasagna a la Boloñesa',
    description: 'Capas alternadas de pasta fresca al huevo, nuestra salsa boloñesa de res y cerdo cocida a fuego lento por 4 horas, bechamel cremosa y queso gratinado al horno.',
    price: { amount: 6800, currency: 'CRC' },
    status: 'available',
    assets: {
      imageUrl: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=600',
      thumbnailUrl: null,
      modelGlbUrl: null,
      modelUsdzUrl: null,
      hasAR: false,
    },
    nutrition: {
      calories: 890,
      allergens: ['Gluten', 'Lácteos', 'Huevo'],
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
    },
    tags: ['Tradicional', 'Horneado'],
    variantGroups: [],
    featured: false,
    featuredRank: null,
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Bebidas
  {
    id: 'limonada-hierbabuena',
    tenantId: 'soda-la-rustica',
    menuId: 'menu-principal',
    categoryId: 'bebidas',
    name: 'Limonada Rústica con Hierbabuena',
    description: 'Zumo de limón recién exprimido, licuado con hojas frescas de hierbabuena y endulzado al gusto.',
    price: { amount: 1800, currency: 'CRC' },
    status: 'available',
    assets: {
      imageUrl: null,
      thumbnailUrl: null,
      modelGlbUrl: null,
      modelUsdzUrl: null,
      hasAR: false,
    },
    nutrition: {
      calories: 120,
      allergens: [],
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
    },
    tags: ['Refrescante', 'Natural'],
    variantGroups: [],
    featured: false,
    featuredRank: null,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'sangria-tintas',
    tenantId: 'soda-la-rustica',
    menuId: 'menu-principal',
    categoryId: 'bebidas',
    name: 'Sangría de la Casa',
    description: 'Nuestra sangría secreta preparada con vino tinto español, licores frutales y una selección de frutas frescas picadas maceradas.',
    price: { amount: 3200, currency: 'CRC' },
    status: 'available',
    assets: {
      imageUrl: null,
      thumbnailUrl: null,
      modelGlbUrl: null,
      modelUsdzUrl: null,
      hasAR: false,
    },
    nutrition: {
      calories: 220,
      allergens: ['Sulfitos'],
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
    },
    tags: ['Coctel', 'Casa'],
    variantGroups: [],
    featured: false,
    featuredRank: null,
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Postres
  {
    id: 'tiramisu',
    tenantId: 'soda-la-rustica',
    menuId: 'menu-principal',
    categoryId: 'postres',
    name: 'Tiramisú Clásico',
    description: 'Postre italiano tradicional preparado con bizcochos de soletilla bañados en café espresso fuerte y licor Amaretto, cubierto con una sedosa crema de queso mascarpone y cacao espolvoreado.',
    price: { amount: 3500, currency: 'CRC' },
    status: 'available',
    assets: {
      imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600',
      thumbnailUrl: null,
      modelGlbUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
      modelUsdzUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.usdz',
      hasAR: true,
    },
    nutrition: {
      calories: 450,
      allergens: ['Gluten', 'Lácteos', 'Huevo'],
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: false,
    },
    tags: ['Postre', 'Favorito'],
    variantGroups: [],
    featured: false,
    featuredRank: null,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const MOCK_MENU: Menu = {
  id: 'menu-principal',
  tenantId: 'soda-la-rustica',
  name: 'Menú Principal',
  description: 'Nuestra selección exclusiva de pizzas artesanas y platos italianos caseros.',
  status: 'active',
  categoryOrder: ['destacados', 'pizzas', 'pastas', 'bebidas', 'postres'],
  schedule: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const MOCK_TABLES: Table[] = [
  {
    id: 'mesa-1',
    tenantId: 'soda-la-rustica',
    menuId: 'menu-principal',
    number: '1',
    label: 'Terraza 1',
    status: 'active',
    qrCodeUrl: null,
    qrMenuUrl: null,
    qrGeneratedAt: null,
    createdAt: new Date(),
  },
  {
    id: 'mesa-2',
    tenantId: 'soda-la-rustica',
    menuId: 'menu-principal',
    number: '2',
    label: 'Terraza 2',
    status: 'active',
    qrCodeUrl: null,
    qrMenuUrl: null,
    qrGeneratedAt: null,
    createdAt: new Date(),
  },
  {
    id: 'mesa-3',
    tenantId: 'soda-la-rustica',
    menuId: 'menu-principal',
    number: '3',
    label: 'Salón Principal 3',
    status: 'active',
    qrCodeUrl: null,
    qrMenuUrl: null,
    qrGeneratedAt: null,
    createdAt: new Date(),
  },
]

export class MockMenuRepository implements IMenuRepository {
  async getActiveByTenantId(_tenantId: string): Promise<Menu[]> {
    return [MOCK_MENU]
  }

  async getById(_tenantId: string, menuId: string): Promise<Menu> {
    if (menuId === MOCK_MENU.id || menuId === 'default' || !menuId) {
      return MOCK_MENU
    }
    throw new NotFoundError('Menu', menuId)
  }
}

export class MockCategoryRepository implements ICategoryRepository {
  async getByMenuId(_tenantId: string, _menuId: string): Promise<Category[]> {
    return MOCK_CATEGORIES
  }

  async getById(_tenantId: string, _menuId: string, categoryId: string): Promise<Category> {
    const category = MOCK_CATEGORIES.find((c) => c.id === categoryId)
    if (!category) throw new NotFoundError('Category', categoryId)
    return category
  }
}

export class MockDishRepository implements IDishRepository {
  async getByMenuId(_tenantId: string, _menuId: string): Promise<Dish[]> {
    return MOCK_DISHES
  }

  async getById(_tenantId: string, _menuId: string, dishId: string): Promise<Dish> {
    const dish = MOCK_DISHES.find((d) => d.id === dishId)
    if (!dish) throw new NotFoundError('Dish', dishId)
    return dish
  }

  async getByCategoryId(_tenantId: string, _menuId: string, categoryId: string): Promise<Dish[]> {
    return MOCK_DISHES.filter((d) => d.categoryId === categoryId)
  }
}

export class MockTableRepository implements ITableRepository {
  async getById(_tenantId: string, tableId: string): Promise<Table> {
    const table = MOCK_TABLES.find((t) => t.id === tableId)
    if (table) return table
    // Fallback to table 1 if not found, to keep things working
    return MOCK_TABLES[0]!
  }

  async getAll(_tenantId: string): Promise<Table[]> {
    return MOCK_TABLES
  }
}
