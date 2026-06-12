import { useState, useEffect } from 'react'
import {
  X,
  Sparkles,
  Camera,
  Trash2,
  Plus,
  Check,
  Loader2,
  FileText,
  AlertCircle,
  HelpCircle
} from 'lucide-react'
import { cn } from '@shared/utils/cn'
import { OnboardingService } from '../../services/OnboardingService'
import { useQuery } from '@tanstack/react-query'
import { MenuService } from '@features/menus/services/MenuService'
import { GeminiApiService } from '@infrastructure/services/GeminiApiService'
import type { GeminiMenuPayload } from '@features/editor/services/AIParserService'

interface MenuDigitizerModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly tenantId: string
  readonly tenantName: string
}

interface ScannedDish {
  id: string
  name: string
  price: number
  description: string
  included?: boolean
}

interface ScannedCategory {
  id: string
  name: string
  dishes: ScannedDish[]
}

const generateId = () => Math.random().toString(36).slice(2, 10)

// Convierte un archivo a base64 (sin el prefijo data:) para la API de Gemini.
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') { reject(new Error('FileReader error')); return }
      const base64 = result.split(',')[1]
      if (!base64) { reject(new Error('base64 extraction failed')); return }
      resolve(base64)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

// Mapea lo que extrae Gemini al editor de revisión (categorías → platos).
function payloadToCategories(payload: GeminiMenuPayload): ScannedCategory[] {
  const knownCategoryIds = new Set(payload.categories.map((c) => c.id))
  const cats: ScannedCategory[] = payload.categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    dishes: payload.dishes
      .filter((d) => d.categoryId === cat.id)
      .map((d) => ({ id: d.id, name: d.name, price: d.numericPrice ?? 0, description: d.description ?? '', included: true })),
  }))

  const orphans = payload.dishes.filter((d) => !knownCategoryIds.has(d.categoryId))
  if (orphans.length > 0) {
    cats.push({
      id: 'otros',
      name: 'Otros',
      dishes: orphans.map((d) => ({ id: d.id, name: d.name, price: d.numericPrice ?? 0, description: d.description ?? '', included: true })),
    })
  }

  return cats.filter((c) => c.dishes.length > 0)
}

const SODA_PRESET: ScannedCategory[] = [
  {
    id: 'soda-c1',
    name: 'Casados y Almuerzos',
    dishes: [
      { id: 'soda-d1', name: 'Casado con Carne de Res', price: 4200, description: 'Con arroz, frijoles, ensalada de repollo, picadillo del día y plátano maduro' },
      { id: 'soda-d2', name: 'Casado con Pollo a la Plancha', price: 3800, description: 'Pechuga de pollo a la plancha con acompañamientos tradicionales' },
      { id: 'soda-d3', name: 'Casado con Pescado Empanizado', price: 4500, description: 'Filete de pescado fresco frito al momento con guarniciones' },
    ],
  },
  {
    id: 'soda-c2',
    name: 'Entradas y Picadas',
    dishes: [
      { id: 'soda-d4', name: 'Patacones con Frijoles y Queso', price: 2800, description: 'Crujientes patacones de plátano verde con frijoles molidos y queso rallado' },
      { id: 'soda-d5', name: 'Empanada arreglada', price: 1500, description: 'Empanada frita rellena de repollo aliñado y salsas tradicionales' },
    ],
  },
  {
    id: 'soda-c3',
    name: 'Bebidas Naturales',
    dishes: [
      { id: 'soda-d6', name: 'Jugo Natural en Agua', price: 1200, description: 'Cas, guanábana, fresa, maracuyá o limón con menta' },
      { id: 'soda-d7', name: 'Jugo Natural en Leche', price: 1500, description: 'Licuados refrescantes de fruta natural en leche' },
    ],
  },
]

const PIZZA_PRESET: ScannedCategory[] = [
  {
    id: 'pizza-c1',
    name: 'Pizzas Artesanales',
    dishes: [
      { id: 'pizza-d1', name: 'Pizza Margherita', price: 6500, description: 'Salsa de tomate casera, queso mozzarella fresco y hojas de albahaca' },
      { id: 'pizza-d2', name: 'Pizza Suprema Rústica', price: 8500, description: 'Jamón, pepperoni, carne molida, chile dulce, cebolla y champiñones' },
      { id: 'pizza-d3', name: 'Pizza Jamón y Hongos', price: 7500, description: 'Jamón York ahumado, champiñones frescos fileteados y mozzarella' },
    ],
  },
  {
    id: 'pizza-c2',
    name: 'Pastas Clásicas',
    dishes: [
      { id: 'pizza-d4', name: 'Fettuccine Alfredo con Pollo', price: 5800, description: 'Salsa blanca cremosa a base de mantequilla y parmesano con pollo a la plancha' },
      { id: 'pizza-d5', name: 'Lasaña Boloñesa', price: 6200, description: 'Capas de pasta rellenas de carne boloñesa, bechamel y queso fundido' },
    ],
  },
]

const CAFE_PRESET: ScannedCategory[] = [
  {
    id: 'cafe-c1',
    name: 'Cafetería Caliente',
    dishes: [
      { id: 'cafe-d1', name: 'Capuccino Italiano', price: 1800, description: 'Café espresso con leche vaporizada y abundante espuma cremosa' },
      { id: 'cafe-d2', name: 'Café Latte Macchiato', price: 1600, description: 'Leche caliente manchada con un espresso doble aromático' },
      { id: 'cafe-d3', name: 'Café Americano Doble', price: 1200, description: 'Doble carga de espresso de especialidad estirado con agua caliente' },
    ],
  },
  {
    id: 'cafe-c2',
    name: 'Sándwiches y Repostería',
    dishes: [
      { id: 'cafe-d4', name: 'Sándwich Caprese en Ciabatta', price: 3800, description: 'Queso mozzarella fresco, rodajas de tomate, arúgula y aderezo pesto casero' },
      { id: 'cafe-d5', name: 'Croissant de Chocolate', price: 1800, description: 'Hojaldre crujiente de mantequilla relleno de crema de chocolate belga' },
      { id: 'cafe-d6', name: 'Tres Leches de la Casa', price: 2500, description: 'Bizcocho húmedo bañado en la receta tradicional de tres leches' },
    ],
  },
]

export function MenuDigitizerModal({ isOpen, onClose, tenantId, tenantName }: MenuDigitizerModalProps) {
  const [step, setStep] = useState<'upload' | 'scanning' | 'review' | 'success'>('upload')
  const [selectedPreset, setSelectedPreset] = useState<'soda' | 'pizza' | 'cafe' | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)

  // Revoke blob URL when uploadedImage changes or component unmounts.
  useEffect(() => {
    if (!uploadedImage?.startsWith('blob:')) return
    return () => URL.revokeObjectURL(uploadedImage)
  }, [uploadedImage])

  // Scanning log state
  const [progressPercent, setProgressPercent] = useState(0)
  const [progressText, setProgressText] = useState('')
  
  // Editor data
  const [categories, setCategories] = useState<ScannedCategory[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Query menus to write to the correct default menu
  const { data: menus = [] } = useQuery({
    queryKey: ['admin-menus', tenantId],
    queryFn: () => MenuService.getMenus(tenantId),
    enabled: isOpen && !!tenantId,
  })
  const defaultMenuId = menus[0]?.id ?? ''

  // Subida real: la foto se manda a Gemini y se mapea al editor de revisión.
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void scanImage(file)
  }

  const scanImage = async (file: File) => {
    setUploadedImage(URL.createObjectURL(file))
    setSelectedPreset(null)
    setSaveError(null)
    setStep('scanning')
    setProgressPercent(0)
    try {
      const base64 = await fileToBase64(file)
      const payload = await GeminiApiService.analyzeMenuImage(base64, file.type)
      const mapped = payloadToCategories(payload)
      if (mapped.length === 0) {
        setSaveError('No pudimos leer platos en la foto. Prueba con una imagen más nítida y de frente.')
        setStep('upload')
        return
      }
      setCategories(mapped)
      setStep('review')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'No se pudo leer el menú. Intenta con otra foto.')
      setStep('upload')
    }
  }

  const handlePresetSelect = (presetType: 'soda' | 'pizza' | 'cafe') => {
    setSelectedPreset(presetType)
    startScanning()
  }

  const startScanning = () => {
    setStep('scanning')
    setProgressPercent(0)
    setProgressText('Subiendo imagen del menú...')
  }

  function generateMenuData() {
    let preset: ScannedCategory[]
    const nameLower = tenantName.toLowerCase()

    if (selectedPreset === 'soda') {
      preset = SODA_PRESET
    } else if (selectedPreset === 'pizza') {
      preset = PIZZA_PRESET
    } else if (selectedPreset === 'cafe') {
      preset = CAFE_PRESET
    } else {
      // Auto-detect based on business name
      if (nameLower.includes('pizza') || nameLower.includes('pasta') || nameLower.includes('italia')) {
        preset = PIZZA_PRESET
      } else if (nameLower.includes('cafe') || nameLower.includes('coffee') || nameLower.includes('panader') || nameLower.includes('pasteler')) {
        preset = CAFE_PRESET
      } else {
        preset = SODA_PRESET
      }
    }

    // Clone to ensure deep mutations don't bug React state
    const cloned = preset.map(c => ({
      id: c.id,
      name: c.name,
      dishes: c.dishes.map(d => ({
        id: d.id,
        name: d.name,
        price: d.price,
        description: d.description,
        included: true
      }))
    }))

    setCategories(cloned)
  }

  // Scanning loop animation — SOLO para los demos con preset (no imagen real).
  useEffect(() => {
    if (step !== 'scanning' || selectedPreset === null) return

    let current = 0
    const interval = setInterval(() => {
      current += 4
      setProgressPercent(Math.min(current, 100))

      if (current < 20) {
        setProgressText('Buscando bordes y mejorando contraste...')
      } else if (current < 45) {
        setProgressText('OCR: Leyendo bloques de texto y palabras...')
      } else if (current < 70) {
        setProgressText('IA: Identificando platos, precios y monedas...')
      } else if (current < 90) {
        setProgressText('IA: Agrupando en categorías sugeridas...')
      } else {
        setProgressText('Estructurando datos en un formato amigable...')
      }

      if (current >= 100) {
        clearInterval(interval)
        setTimeout(() => {
          generateMenuData()
          setStep('review')
        }, 500)
      }
    }, 120)

    return () => clearInterval(interval)
  }, [step, selectedPreset])

  // Animación mientras Gemini analiza la imagen real (no completa sola: la
  // transición a 'review' la dispara scanImage cuando llega la respuesta).
  useEffect(() => {
    if (step !== 'scanning' || selectedPreset !== null) return

    let current = 6
    const interval = setInterval(() => {
      current = current >= 92 ? 92 : current + 3
      setProgressPercent(current)
      setProgressText(
        current < 38 ? 'Subiendo y mejorando la imagen…' :
        current < 72 ? 'IA leyendo platos y precios…' :
        'Estructurando tu menú…',
      )
    }, 200)

    return () => clearInterval(interval)
  }, [step, selectedPreset])

  // Categories editing callbacks
  const handleCategoryNameChange = (catId: string, newName: string) => {
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, name: newName } : c))
  }

  const handleAddCategory = () => {
    setCategories(prev => [
      ...prev,
      {
        id: `custom-c-${generateId()}`,
        name: 'Nueva Categoría',
        dishes: []
      }
    ])
  }

  const handleDeleteCategory = (catId: string) => {
    setCategories(prev => prev.filter(c => c.id !== catId))
  }

  // Dishes editing callbacks
  const handleDishChange = (catId: string, dishId: string, patch: Partial<ScannedDish>) => {
    setCategories(prev => prev.map(c => {
      if (c.id !== catId) return c
      return {
        ...c,
        dishes: c.dishes.map(d => d.id === dishId ? { ...d, ...patch } : d)
      }
    }))
  }

  const handleAddDish = (catId: string) => {
    setCategories(prev => prev.map(c => {
      if (c.id !== catId) return c
      return {
        ...c,
        dishes: [
          ...c.dishes,
          {
            id: `custom-d-${generateId()}`,
            name: '',
            price: 0,
            description: '',
            included: true
          }
        ]
      }
    }))
  }

  const handleDeleteDish = (catId: string, dishId: string) => {
    setCategories(prev => prev.map(c => {
      if (c.id !== catId) return c
      return {
        ...c,
        dishes: c.dishes.filter(d => d.id !== dishId)
      }
    }))
  }

  // Database persistence
  const handleSaveMenu = async () => {
    if (!defaultMenuId) {
      setSaveError('No se encontró un menú activo para guardar. Intenta de nuevo.')
      return
    }

    setIsSaving(true)
    setSaveError(null)

    // Filter included dishes
    const formattedData = categories
      .map(c => ({
        name: c.name,
        dishes: c.dishes
          .filter(d => d.included && d.name.trim() !== '')
          .map(d => ({
            name: d.name,
            price: Number(d.price) || 0,
            description: d.description
          }))
      }))
      .filter(c => c.name.trim() !== '' && c.dishes.length > 0)

    if (formattedData.length === 0) {
      setSaveError('Debes incluir al menos un plato con nombre para digitalizar el menú.')
      setIsSaving(false)
      return
    }

    try {
      await OnboardingService.saveDigitizedMenu(tenantId, defaultMenuId, formattedData)
      setStep('success')
    } catch (err) {
      console.error(err)
      setSaveError('Error al guardar el menú digitalizado. Intenta nuevamente.')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
      <div className={cn(
        "relative flex flex-col gap-5 rounded-3xl bg-surface-0 p-6 shadow-2xl transition-all duration-300 w-full",
        step === 'review' ? "max-w-4xl max-h-[90vh]" : "max-w-lg"
      )}>
        {/* Header (hidden in success) */}
        {step !== 'success' && (
          <div className="flex items-center justify-between border-b border-surface-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                <Sparkles size={16} className="animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-surface-900 text-sm sm:text-base">
                  Digitalizador de Menú Físico con IA
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-surface-400 hover:bg-surface-50 hover:text-surface-600 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* ──────── STEP 1: UPLOAD & PRESETS ──────── */}
        {step === 'upload' && (
          <div className="flex flex-col gap-5">
            <div className="text-center">
              <p className="text-xs text-surface-500 leading-relaxed">
                Tómale una foto a tu menú físico o sube un archivo (PNG, JPG) para que nuestro asistente de Inteligencia Artificial extraiga automáticamente los platos, descripciones y precios.
              </p>
            </div>

            {saveError && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left">
                <AlertCircle size={15} className="shrink-0 text-red-500 mt-0.5" />
                <p className="text-xs font-semibold text-red-700">{saveError}</p>
              </div>
            )}

            {/* Drag and Drop Zone */}
            <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-surface-200 bg-surface-50/50 hover:bg-surface-50 hover:border-brand-300 p-8 text-center cursor-pointer transition-all">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm border border-surface-150 text-surface-500 mb-3">
                <Camera size={20} />
              </div>
              <span className="text-xs font-bold text-surface-800">
                Subir o Tomar Foto del Menú
              </span>
              <span className="text-[10px] text-surface-400 mt-1">
                Arrastra tu foto aquí o haz clic para explorar
              </span>
            </label>

            {/* Fast Presets (Simulator Demos) */}
            <div className="flex flex-col gap-2.5 border-t border-surface-100 pt-4">
              <div className="flex items-center gap-1.5 justify-center">
                <FileText size={12} className="text-amber-500" />
                <span className="text-[10px] font-bold text-surface-505 uppercase tracking-wider">
                  ¿No tienes una foto a mano? Prueba el demo rápido:
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handlePresetSelect('soda')}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-surface-150 bg-white hover:border-brand-300 hover:bg-brand-50/30 p-3 text-center transition-all cursor-pointer"
                >
                  <span className="text-lg">🍲</span>
                  <span className="text-[10.5px] font-semibold text-surface-700">Soda Típica</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetSelect('pizza')}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-surface-150 bg-white hover:border-brand-300 hover:bg-brand-50/30 p-3 text-center transition-all cursor-pointer"
                >
                  <span className="text-lg">🍕</span>
                  <span className="text-[10.5px] font-semibold text-surface-700">Pizzería</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetSelect('cafe')}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-surface-150 bg-white hover:border-brand-300 hover:bg-brand-50/30 p-3 text-center transition-all cursor-pointer"
                >
                  <span className="text-lg">☕</span>
                  <span className="text-[10.5px] font-semibold text-surface-700">Cafetería</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ──────── STEP 2: SCANNING ANIMATION ──────── */}
        {step === 'scanning' && (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-5">
            {/* Visual Scanner Mock */}
            <div className="relative h-44 w-36 overflow-hidden rounded-xl border border-surface-200 bg-surface-100 shadow-inner flex items-center justify-center">
              {uploadedImage ? (
                <img src={uploadedImage} alt="Physical Menu" className="h-full w-full object-cover opacity-60" />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-surface-350">
                  <FileText size={40} className="stroke-[1.5]" />
                  <span className="text-[9px] font-semibold">MockMenu.jpg</span>
                </div>
              )}
              {/* Laser beam scan lines */}
              <div className="absolute left-0 right-0 h-1 bg-brand-500/80 shadow-[0_0_12px_#e99a0e] animate-bounce w-full" style={{ animationDuration: '2.5s' }} />
            </div>

            <div className="flex flex-col gap-2 w-full px-4">
              <span className="text-xs font-semibold text-surface-750">
                {progressText}
              </span>
              <div className="h-2 w-full rounded-full bg-surface-100 overflow-hidden border border-surface-150">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-150 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-brand-600">
                {progressPercent}% Completado
              </span>
            </div>
          </div>
        )}

        {/* ──────── STEP 3: REVIEW & CORRECTION EDITOR ──────── */}
        {step === 'review' && (
          <div className="flex flex-col gap-4 overflow-hidden">
            {/* Alert info */}
            <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50/50 p-3 text-left">
              <HelpCircle size={15} className="text-blue-600 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-blue-900">
                  Revisión Manual del Escaneo
                </span>
                <span className="text-[10px] text-blue-700 leading-normal">
                  La IA ha estructurado los platos que encontró. Revisa que los precios y nombres estén correctos. Puedes desmarcar platos que no quieras añadir, corregir descripciones o **añadir platos nuevos rápidamente** con el botón de agregar.
                </span>
              </div>
            </div>

            {/* Categories and dishes spreadsheet */}
            <div className="flex-1 overflow-y-auto max-h-[50vh] pr-1 flex flex-col gap-5">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="rounded-2xl border border-surface-150 bg-surface-50/40 p-4 flex flex-col gap-3.5"
                >
                  {/* Category row header */}
                  <div className="flex items-center justify-between gap-3 border-b border-surface-100 pb-2">
                    <div className="flex items-center gap-1.5 flex-1">
                      <span className="text-xs font-bold text-surface-400">Categoría:</span>
                      <input
                        type="text"
                        value={cat.name}
                        onChange={(e) => handleCategoryNameChange(cat.id, e.target.value)}
                        className="bg-transparent text-sm font-black text-surface-800 placeholder:text-surface-300 focus:outline-none border-b border-dashed border-surface-200 focus:border-brand-500 px-1 py-0.5 w-64"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="rounded-lg p-1 text-surface-350 hover:bg-red-50 hover:text-red-500 transition-colors"
                      title="Eliminar categoría completa"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Dishes inside this category */}
                  <div className="flex flex-col gap-2">
                    {cat.dishes.map((dish) => (
                      <div
                        key={dish.id}
                        className={cn(
                          "grid grid-cols-1 md:grid-cols-[auto_1fr_120px_1.5fr_auto] items-center gap-3 rounded-xl border p-2.5 transition-all bg-white",
                          dish.included
                            ? "border-surface-150"
                            : "border-surface-100 opacity-40 bg-surface-50/50"
                        )}
                      >
                        {/* Checkbox to include/exclude */}
                        <input
                          type="checkbox"
                          checked={dish.included ?? true}
                          onChange={(e) => handleDishChange(cat.id, dish.id, { included: e.target.checked })}
                          className="h-4 w-4 rounded accent-brand-500 cursor-pointer"
                        />

                        {/* Dish Name */}
                        <input
                          type="text"
                          value={dish.name}
                          disabled={!dish.included}
                          onChange={(e) => handleDishChange(cat.id, dish.id, { name: e.target.value })}
                          placeholder="Nombre del plato (ej: Casado de Res)"
                          className="bg-transparent text-xs font-bold text-surface-800 placeholder:text-surface-300 focus:outline-none border-b border-transparent focus:border-brand-500 px-1 py-0.5 w-full disabled:cursor-not-allowed"
                        />

                        {/* Price */}
                        <div className="flex items-center gap-1 border-b border-transparent focus-within:border-brand-500 px-1 py-0.5">
                          <span className="text-[10px] text-surface-400">₡</span>
                          <input
                            type="number"
                            min="0"
                            step="100"
                            disabled={!dish.included}
                            value={dish.price}
                            onChange={(e) => handleDishChange(cat.id, dish.id, { price: parseFloat(e.target.value) || 0 })}
                            placeholder="Precio"
                            className="bg-transparent text-xs font-semibold text-surface-800 placeholder:text-surface-350 focus:outline-none w-full text-right disabled:cursor-not-allowed"
                          />
                        </div>

                        {/* Description */}
                        <input
                          type="text"
                          value={dish.description}
                          disabled={!dish.included}
                          onChange={(e) => handleDishChange(cat.id, dish.id, { description: e.target.value })}
                          placeholder="Acompañamientos / descripción del plato..."
                          className="bg-transparent text-xs text-surface-500 placeholder:text-surface-300 focus:outline-none border-b border-transparent focus:border-brand-500 px-1 py-0.5 w-full disabled:cursor-not-allowed"
                        />

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteDish(cat.id, dish.id)}
                          className="text-surface-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}

                    {/* Quick add dish row within category */}
                    <button
                      type="button"
                      onClick={() => handleAddDish(cat.id)}
                      className="flex items-center gap-1.5 self-start text-[11px] font-bold text-brand-600 hover:text-brand-700 hover:bg-brand-50/50 rounded-lg px-2.5 py-1.5 transition-all mt-1 cursor-pointer"
                    >
                      <Plus size={11} />
                      Añadir plato a {cat.name}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Error messaging */}
            {saveError && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600 border border-red-200">
                <AlertCircle size={14} className="shrink-0" />
                {saveError}
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between border-t border-surface-100 pt-4 mt-1">
              <button
                type="button"
                onClick={handleAddCategory}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-surface-500 hover:text-surface-700 bg-surface-50 border border-surface-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
              >
                <Plus size={12} />
                Agregar nueva categoría
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('upload')}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-surface-500 hover:bg-surface-50 border border-surface-200 transition-colors cursor-pointer"
                >
                  Volver a cargar
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveMenu}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 text-xs font-black shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving && <Loader2 size={12} className="animate-spin" />}
                  {isSaving ? 'Guardando...' : 'Confirmar y Crear Menú ⚡'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ──────── STEP 4: SUCCESS VIEW ──────── */}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center text-center py-6 gap-5 animate-fade-in">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check size={32} className="text-green-600 stroke-[3]" />
            </div>
            <div className="flex flex-col gap-2">
              <h4 className="text-xl font-bold text-surface-900">
                ¡Menú Digitalizado con Éxito!
              </h4>
              <p className="text-xs text-surface-500 leading-relaxed max-w-sm">
                Hemos subido todas las categorías y platos validados a la base de datos de tu restaurante. Ya puedes cerrar esta ventana para elegir el diseño final.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-2xl bg-brand-500 hover:bg-brand-600 py-3.5 text-xs font-black text-white shadow-md active:scale-95 transition-all cursor-pointer"
            >
              Listo, Continuar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
