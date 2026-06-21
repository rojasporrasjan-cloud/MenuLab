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
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-brand-600">
            Organización
          </p>
          <h1 className="text-[22px] font-black leading-tight tracking-tight text-surface-900">
            Menús
          </h1>
          <p className="text-[13px] text-surface-500">
            Organiza tus menús y sus categorías.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" asChild className="rounded-xl shadow-sm border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 hidden sm:flex">
            <Link to={`${ROUTES.admin.editor}?openDigitalize=1`}>
              <Sparkles size={15} className="mr-2" />
              Digitalizar IA
            </Link>
          </Button>
          <Button onClick={() => setMenuModal({ type: 'create' })} className="rounded-xl shadow-sm">
            <PlusCircle size={15} className="mr-2" />
            Nuevo menú
          </Button>
        </div>
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
        <div className="grid gap-6 lg:grid-cols-12">

          {/* ── Left panel: menu list ── */}
          <div className="flex flex-col gap-3 lg:col-span-4">
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
            className="flex flex-col gap-5 rounded-[24px] border border-zinc-200/80 bg-white p-6 shadow-sm lg:col-span-8"
          >
            {!selectedMenu ? (
              <div className="flex h-40 flex-col items-center justify-center text-zinc-400 gap-2">
                <BookOpen size={32} className="opacity-50" />
                <p className="text-[14px] font-medium">Selecciona un menú a la izquierda</p>
              </div>
            ) : (
              <>
                {/* Panel header con Banner descriptivo */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="truncate text-[20px] font-bold text-zinc-900 leading-tight">
                        {selectedMenu.name}
                      </h2>
                      <p className="text-[13px] text-zinc-500 font-medium">Categorías de este menú</p>
                    </div>
                    
                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        asChild
                        className="rounded-xl shadow-sm text-[13px]"
                      >
                        <Link to={dishListUrl}>
                          <ExternalLink size={15} className="mr-1.5" />
                          Ver platos
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setCategoryModal({ type: 'create' })}
                        className="rounded-xl shadow-sm text-[13px] bg-amber-500 hover:bg-amber-600 border-none"
                      >
                        <PlusCircle size={15} className="mr-1.5" />
                        Añadir Categoría
                      </Button>
                    </div>
                  </div>

                  {/* Banner explicativo a prueba de tontos */}
                  <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50/50 p-4 border border-amber-100/50">
                    <p className="text-[13px] text-amber-900 leading-relaxed">
                      <strong className="font-bold">💡 Tip:</strong> Este es el esqueleto de tu menú. Las categorías agrupan tus platos y los clientes las verán <strong>exactamente en el orden que las organices aquí</strong>. <br className="hidden sm:block"/>
                      Ejemplo de categorías: <em>Entradas, Platos Fuertes, Bebidas, Postres</em>.
                    </p>
                  </div>
                </div>

                {/* Category loading */}
                {catLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Spinner size="md" />
                  </div>
                )}

                {/* Empty categories */}
                {!catLoading && categories.length === 0 && (
                  <div
                    className="flex flex-col items-center justify-center rounded-[20px] py-14 text-center border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-6"
                  >
                    <div className="relative mb-4">
                      <div className="absolute -inset-4 rounded-full bg-amber-100/50 blur-xl" />
                      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm border border-amber-100 text-amber-500">
                        <Layers size={32} strokeWidth={1.5} />
                      </div>
                    </div>
                    <p className="text-[18px] font-bold text-zinc-800">No tienes categorías aún</p>
                    <p className="mt-2 text-[14px] text-zinc-500 max-w-[320px] leading-relaxed">
                      El primer paso para armar tu menú es crear categorías. Por ejemplo: "Bebidas Calientes" o "Sándwiches".
                    </p>
                    <Button
                      size="md"
                      onClick={() => setCategoryModal({ type: 'create' })}
                      className="mt-6 shadow-sm bg-amber-500 hover:bg-amber-600 rounded-xl font-bold"
                    >
                      <PlusCircle size={16} className="mr-2" />
                      Crear mi primera categoría
                    </Button>
                  </div>
                )}

                {/* Category list */}
                {!catLoading && categories.length > 0 && (
                  <div className="flex flex-col gap-2 mt-2">
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
                  <div className="mt-2 flex items-start gap-2.5 rounded-xl bg-zinc-50 px-4 py-3 border border-zinc-200/60">
                    <AlertCircle size={15} className="mt-0.5 shrink-0 text-zinc-400" />
                    <p className="text-[12px] text-zinc-500 leading-relaxed">
                      Si eliminas una categoría, <strong>no perderás los platos</strong> que están dentro de ella, simplemente quedarán sin categoría asignada en tu lista general de platos.
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
