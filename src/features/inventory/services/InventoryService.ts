import { FirestoreIngredientRepository } from '@infrastructure/repositories/FirestoreIngredientRepository'
import { FirestoreRecipeRepository } from '@infrastructure/repositories/FirestoreRecipeRepository'
import { FirestoreStockMovementRepository } from '@infrastructure/repositories/FirestoreStockMovementRepository'
import { ListIngredientsUseCase } from '@core/use-cases/inventory/ListIngredientsUseCase'
import { CreateIngredientUseCase } from '@core/use-cases/inventory/CreateIngredientUseCase'
import { UpdateIngredientUseCase } from '@core/use-cases/inventory/UpdateIngredientUseCase'
import { RegisterStockMovementUseCase } from '@core/use-cases/inventory/RegisterStockMovementUseCase'
import { ListStockMovementsUseCase } from '@core/use-cases/inventory/ListStockMovementsUseCase'
import { GetRecipeUseCase } from '@core/use-cases/inventory/GetRecipeUseCase'
import { ListRecipesUseCase } from '@core/use-cases/inventory/ListRecipesUseCase'
import { SaveRecipeUseCase } from '@core/use-cases/inventory/SaveRecipeUseCase'
import { DeductStockForOrderUseCase } from '@core/use-cases/inventory/DeductStockForOrderUseCase'

/**
 * Composition root del feature de inventario.
 * Singleton a nivel de módulo — mismo patrón que OrderService.
 */
const ingredientRepository = new FirestoreIngredientRepository()
const recipeRepository = new FirestoreRecipeRepository()
const stockMovementRepository = new FirestoreStockMovementRepository()

export const InventoryService = {
  listIngredients: new ListIngredientsUseCase(ingredientRepository),
  createIngredient: new CreateIngredientUseCase(ingredientRepository),
  updateIngredient: new UpdateIngredientUseCase(ingredientRepository),
  registerMovement: new RegisterStockMovementUseCase(stockMovementRepository),
  listMovements: new ListStockMovementsUseCase(stockMovementRepository),
  getRecipe: new GetRecipeUseCase(recipeRepository),
  listRecipes: new ListRecipesUseCase(recipeRepository),
  saveRecipe: new SaveRecipeUseCase(recipeRepository),
  deductStockForOrder: new DeductStockForOrderUseCase(recipeRepository, stockMovementRepository),
} as const
