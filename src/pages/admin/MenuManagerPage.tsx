import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, BookOpen, Layers, AlertCircle, ExternalLink } from 'lucide-react'
import { useTenantContext } from '@app/providers/TenantProvider'
import {
  MenuCard,
  MenuFormModal,
  CategoryItem,
  CategoryFormModal,
  useAdminMenus,
  useMenuCategories,
  useCreateMenu,
  useUpdateMenu,
  useArchiveMenu,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useMoveCategory,
} from '@features/menus'
import { Button } from '@shared/ui/components/Button'
import { Spinner } from '@shared/ui/components/Spinner'
import { ROUTES } from '@shared/constants/routes'
import type { Menu } from '@core/domain/entities/Menu'
import type { Category } from '@core/domain/entities/Category'
import type { MenuFormValues, CategoryFormValues } from '@features/menus'

// ── Modal state helpers ───────────────────────────────────────────────────────

type MenuModal = { type: 'create' } | { type: 'edit'; menu: Menu }
type CategoryModal = { type: 'create' } | { type: 'edit'; category: Category }

export default function MenuManagerPage() {
  const { tenantId } = useTenantContext()

  const { data: menus = [], isLoading: menusLoading } = useAdminMenus(tenantId)
  const [selectedMenuId, setSelectedMenuId] = useState<string | null>(null)

  const resolvedMenuId = selectedMenuId ?? menus[0]?.id ?? null
  const selectedMenu = menus.find((m) => m.id === resolvedMenuId) ?? null

  const { data: categories = [], isLoading: catLoading } = useMenuCategories(
    tenantId,
    resolvedMenuId,
  )

  // ── Menu mutations ──────────────────────────────────────────────────────────
  const { createMenu, isLoading: isCreatingMenu, error: createMenuError } = useCreateMenu(tenantId)
  const { updateMenu, isLoading: isUpdatingMenu, error: updateMenuError } = useUpdateMenu(tenantId)
  const { archiveMenu, archivingId } = useArchiveMenu(tenantId)

  // ── Category mutations ──────────────────────────────────────────────────────
  const { createCategory, isLoading: isCreatingCat, error: createCatError } = useCreateCategory(tenantId)
  const { updateCategory, isLoading: isUpdatingCat, error: updateCatError } = useUpdateCategory(tenantId)
  const { deleteCategory, deletingId } = useDeleteCategory(tenantId)
  const { moveUp, moveDown, movingId } = useMoveCategory(tenantId)

  // ── Modal state ─────────────────────────────────────────────────────────────
  const [menuModal, setMenuModal] = useState<MenuModal | null>(null)
  const [categoryModal, setCategoryModal] = useState<CategoryModal | null>(null)

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleMenuSubmit = async (values: MenuFormValues) => {
    if (menuModal?.type === 'edit') {
      await updateMenu(menuModal.menu.id, values)
    } else {
      const newId = await createMenu(values)
      setSelectedMenuId(newId)
    }
    setMenuModal(null)
  }

  const handleCategorySubmit = async (values: CategoryFormValues) => {
    if (!resolvedMenuId) return
    if (categoryModal?.type === 'edit') {
      await updateCategory(resolvedMenuId, categoryModal.category.id, values)
    } else {
      await createCategory(resolvedMenuId, values, categories)
    }
    setCategoryModal(null)
  }

  const dishListUrl = resolvedMenuId
    ? `${ROUTES.admin.dishes.list}?menuId=${resolvedMenuId}`
    : ROUTES.admin.dishes.list

  return (
    <div className="flex flex-col gap-7">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
            Organización
          </p>
          <h1 className="text-[26px] font-bold tracking-[-0.02em] text-zinc-900">
            Menús
          </h1>
          <p className="text-[13px] text-zinc-500">
            Organiza tus menús y sus categorías.
          </p>
        </div>
        <Button onClick={() => setMenuModal({ type: 'create' })} className="rounded-xl shadow-sm">
          <PlusCircle size={15} className="mr-2" />
          Nuevo menú
        </Button>
      </div>

      {/* Main loading */}
      {menusLoading && (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      )}

      {/* Empty state — no menus */}
      {!menusLoading && menus.length === 0 && (
        <div
          className="flex flex-col items-center justify-center rounded-2xl py-20 text-center border-2 border-dashed border-zinc-200 bg-white p-6 shadow-sm"
        >
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50 border border-zinc-100 text-zinc-400"
          >
            <BookOpen size={24} strokeWidth={1.5} />
          </div>
          <p className="mt-4 text-[15px] font-bold text-zinc-800">Sin menús</p>
          <p className="mt-1 text-[13px] text-zinc-500 max-w-[280px]">
            Crea tu primer menú para empezar a agregar platos.
          </p>
          <Button className="mt-5 rounded-xl shadow-sm" onClick={() => setMenuModal({ type: 'create' })}>
            <PlusCircle size={15} className="mr-2" />
            Crear menú
          </Button>
        </div>
      )}

      {/* Two-panel layout */}
      {!menusLoading && menus.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-5">

          {/* ── Left panel: menu list ── */}
          <div className="flex flex-col gap-2 lg:col-span-2">
            {menus.map((menu) => (
              <MenuCard
                key={menu.id}
                menu={menu}
                categoryCount={resolvedMenuId === menu.id ? categories.length : 0}
                isSelected={resolvedMenuId === menu.id}
                isArchiving={archivingId === menu.id}
                onSelect={() => setSelectedMenuId(menu.id)}
                onEdit={() => setMenuModal({ type: 'edit', menu })}
                onArchive={() => archiveMenu(menu.id)}
              />
            ))}
          </div>

          {/* ── Right panel: categories ── */}
          <div
            className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm lg:col-span-3"
          >
            {!selectedMenu ? (
              <div className="flex h-40 items-center justify-center text-zinc-400">
                <p className="text-sm">Selecciona un menú</p>
              </div>
            ) : (
              <>
                {/* Panel header */}
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-zinc-800">
                      {selectedMenu.name}
                    </h2>
                    <p className="text-xs text-zinc-400">Categorías del menú</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      asChild
                      className="rounded-xl shadow-sm"
                    >
                      <Link to={dishListUrl}>
                        <ExternalLink size={13} className="mr-1.5" />
                        Ver platos
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setCategoryModal({ type: 'create' })}
                      className="rounded-xl shadow-sm"
                    >
                      <PlusCircle size={13} className="mr-1.5" />
                      Categoría
                    </Button>
                  </div>
                </div>

                {/* Category loading */}
                {catLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Spinner size="sm" />
                  </div>
                )}

                {/* Empty categories */}
                {!catLoading && categories.length === 0 && (
                  <div
                    className="flex flex-col items-center justify-center rounded-xl py-12 text-center border border-dashed border-zinc-200 bg-zinc-50/50 p-6"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-zinc-200/60 text-zinc-400 shadow-sm">
                      <Layers size={20} strokeWidth={1.5} />
                    </div>
                    <p className="mt-4 text-[14px] font-semibold text-zinc-700">Sin categorías</p>
                    <p className="mt-1 text-[12px] text-zinc-500 max-w-[240px]">
                      Las categorías agrupan los platos en el menú público.
                    </p>
                    <button
                      type="button"
                      onClick={() => setCategoryModal({ type: 'create' })}
                      className="mt-4 text-[13px] font-semibold text-amber-600 transition-colors hover:text-amber-700"
                    >
                      + Agregar primera categoría
                    </button>
                  </div>
                )}

                {/* Category list */}
                {!catLoading && categories.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {categories.map((cat, idx) => (
                      <CategoryItem
                        key={cat.id}
                        category={cat}
                        index={idx}
                        total={categories.length}
                        isDeleting={deletingId === cat.id}
                        isMoving={movingId === cat.id}
                        onEdit={() => setCategoryModal({ type: 'edit', category: cat })}
                        onDelete={() => resolvedMenuId && deleteCategory(resolvedMenuId, cat.id)}
                        onMoveUp={() => resolvedMenuId && moveUp(resolvedMenuId, cat.id, categories)}
                        onMoveDown={() => resolvedMenuId && moveDown(resolvedMenuId, cat.id, categories)}
                      />
                    ))}
                  </div>
                )}

                {/* Alert for dish impact on delete */}
                {!catLoading && categories.length > 0 && (
                  <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5">
                    <AlertCircle size={13} className="mt-0.5 shrink-0 text-amber-500" />
                    <p className="text-xs text-amber-700">
                      Eliminar una categoría no elimina sus platos, pero los dejará sin categoría asignada.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Menu modal ── */}
      {menuModal && (
        <MenuFormModal
          key={menuModal.type === 'edit' ? menuModal.menu.id : 'new'}
          initialMenu={menuModal.type === 'edit' ? menuModal.menu : null}
          isLoading={menuModal.type === 'edit' ? isUpdatingMenu : isCreatingMenu}
          error={menuModal.type === 'edit' ? updateMenuError : createMenuError}
          onSubmit={handleMenuSubmit}
          onClose={() => setMenuModal(null)}
        />
      )}

      {/* ── Category modal ── */}
      {categoryModal && (
        <CategoryFormModal
          key={categoryModal.type === 'edit' ? categoryModal.category.id : 'new'}
          initialCategory={categoryModal.type === 'edit' ? categoryModal.category : null}
          isLoading={categoryModal.type === 'edit' ? isUpdatingCat : isCreatingCat}
          error={categoryModal.type === 'edit' ? updateCatError : createCatError}
          onSubmit={handleCategorySubmit}
          onClose={() => setCategoryModal(null)}
        />
      )}
    </div>
  )
}
