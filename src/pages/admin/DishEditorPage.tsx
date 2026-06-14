import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { useTenantContext } from '@app/providers/TenantProvider'
import {
  DishForm,
  useAdminDish,
  useAdminCategories,
  useDishImageUpload,
  useCreateDish,
  useUpdateDish,
  useFeaturedDishes,
} from '@features/dishes'
import { LIMITS } from '@shared/constants/limits'
import { Spinner } from '@shared/ui/components/Spinner'
import { ROUTES } from '@shared/constants/routes'
import type { DishFormValues } from '@features/dishes'

export default function DishEditorPage() {
  const { tenantId } = useTenantContext()
  const { dishId } = useParams<{ dishId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const menuId = searchParams.get('menuId') ?? ''
  const isEditing = !!dishId

  const { data: dish, isLoading: dishLoading } = useAdminDish(
    tenantId,
    menuId,
    isEditing ? dishId : null,
  )

  const { data: categories = [], isLoading: catLoading } = useAdminCategories(
    tenantId,
    menuId || null,
  )

  const { createDish, isLoading: isCreating, error: createError } = useCreateDish(tenantId)
  const { updateDish, isLoading: isUpdating, error: updateError } = useUpdateDish(tenantId)

  const imageUpload = useDishImageUpload(isEditing ? dish?.assets.imageUrl : null)

  const { featuredCount } = useFeaturedDishes(tenantId, menuId || null)
  // Al editar un plato ya destacado no cuenta dos veces para el aviso.
  const otherFeaturedCount = featuredCount - (dish?.featured ? 1 : 0)
  const featuredLimitReached = otherFeaturedCount >= LIMITS.featured.maxFeaturedDishes

  const isLoading = isCreating || isUpdating

  const handleSubmit = async (values: DishFormValues) => {
    if (!menuId) return

    try {
      const imageUrl = await imageUpload.uploadAndGetUrl(tenantId)

      if (isEditing && dishId) {
        await updateDish(menuId, dishId, values, imageUrl)
      } else {
        await createDish(menuId, values, imageUrl)
      }

      navigate(`${ROUTES.admin.dishes.list}?menuId=${menuId}`)
    } catch {
      // Error state is managed inside hooks
    }
  }

  // Guard: no menuId in URL
  if (!menuId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle size={32} className="text-amber-400" />
        <p className="mt-3 text-sm font-semibold text-zinc-700">Menú no especificado</p>
        <p className="mt-1 text-xs text-zinc-400">
          Navega desde la lista de platos para crear o editar.
        </p>
        <Link
          to={ROUTES.admin.dishes.list}
          className="mt-4 text-sm font-semibold text-amber-600 hover:underline"
        >
          Ir a platos
        </Link>
      </div>
    )
  }

  // Loading existing dish
  if (isEditing && dishLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  // Dish not found
  if (isEditing && !dishLoading && !dish) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle size={32} className="text-red-400" />
        <p className="mt-3 text-sm font-semibold text-zinc-700">Plato no encontrado</p>
        <Link
          to={ROUTES.admin.dishes.list}
          className="mt-4 text-sm font-semibold text-amber-600 hover:underline"
        >
          Volver a platos
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl">
      {/* Back navigation */}
      <Link
        to={`${ROUTES.admin.dishes.list}?menuId=${menuId}`}
        className="mb-6 flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-700 transition-colors"
      >
        <ArrowLeft size={15} />
        Volver a platos
      </Link>

      <div className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-[20px] font-black tracking-tight text-surface-900">
          {isEditing ? 'Editar plato' : 'Nuevo plato'}
        </h1>

        {catLoading && (
          <div className="flex items-center justify-center py-8">
            <Spinner size="sm" />
          </div>
        )}

        {!catLoading && (
          <DishForm
            key={isEditing ? dish?.id ?? 'loading' : 'new'}
            initialDish={isEditing ? dish ?? null : null}
            categories={categories}
            isLoading={isLoading}
            error={createError ?? updateError}
            previewUrl={imageUpload.previewUrl}
            uploadProgress={imageUpload.uploadProgress}
            isUploading={imageUpload.isUploading}
            onFileSelect={imageUpload.selectFile}
            onFileClear={imageUpload.clearFile}
            onSubmit={handleSubmit}
            featuredLimitReached={featuredLimitReached}
          />
        )}
      </div>
    </div>
  )
}
