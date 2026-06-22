import { useRef, useState } from 'react'
import {
  X,
  UploadCloud,
  ImagePlus,
  Loader2,
  ScanSearch,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Camera,
  Sun,
  AlignCenter,
  FileImage,
  Layers,
  Tag,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { LIMITS } from '@shared/constants/limits'
import type { GeminiMenuPayload } from '@features/editor/services/AIParserService'
import { importGeminiMenuToFirestore } from '@features/editor/services/AIMenuImportService'
import { GeminiApiService } from '@infrastructure/services/GeminiApiService'

// ─── Props ────────────────────────────────────────────────────────────────────

interface MenuScannerModalProps {
  readonly tenantId: string
  readonly menuId: string | null
  readonly onClose: () => void
}

// ─── File helpers ─────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]

const MAX_BYTES = LIMITS.upload.maxFileSizeBytes
const MAX_SIZE_MB = MAX_BYTES / (1024 * 1024)

type ValidationError = 'TYPE_NOT_SUPPORTED' | 'FILE_TOO_LARGE'

const VALIDATION_MSGS: Record<ValidationError, string> = {
  TYPE_NOT_SUPPORTED: 'Solo se aceptan imágenes JPG, PNG, WebP o PDF.',
  FILE_TOO_LARGE: `El archivo supera el límite de ${MAX_SIZE_MB} MB.`,
}

function validateFile(file: File): ValidationError | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return 'TYPE_NOT_SUPPORTED'
  if (file.size > MAX_BYTES) return 'FILE_TOO_LARGE'
  return null
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      
      // If it's a PDF, DO NOT put it in an Image! Just return the base64 directly.
      // Safari will throw "The string did not match the expected pattern." if you feed a PDF data URI to img.src.
      if (file.type === 'application/pdf') {
        const base64 = dataUrl.split(',')[1]
        if (!base64) reject(new Error('base64 extraction failed'))
        else resolve(base64)
        return
      }

      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_DIMENSION = 1600
        let width = img.width
        let height = img.height

        if (width > height && width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width)
          width = MAX_DIMENSION
        } else if (height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height)
          height = MAX_DIMENSION
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('No 2d context'))
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7)
        const base64 = compressedDataUrl.split(',')[1]
        if (!base64) {
          reject(new Error('base64 extraction failed'))
          return
        }
        resolve(base64)
      }
      img.onerror = () => reject(new Error('Image load error'))
      img.src = dataUrl
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

// ─── Camera tips ─────────────────────────────────────────────────────────────

const PHOTO_TIPS = [
  { icon: Sun,         text: 'Iluminación uniforme — evita sombras sobre el texto' },
  { icon: AlignCenter, text: 'Menú plano y centrado — sin dobladuras ni ángulos' },
  { icon: Camera,      text: 'Foto nítida — aleja un poco el teléfono si es necesario' },
  { icon: FileImage,   text: 'Puedes subir un PDF escaneado si tienes uno disponible' },
] as const

// ─── Extracted data preview ───────────────────────────────────────────────────

interface PreviewPanelProps {
  readonly payload: GeminiMenuPayload
}

function PreviewPanel({ payload }: PreviewPanelProps) {
  const totalDishes = payload.dishes.length

  const byCategory = payload.categories.map((cat) => ({
    cat,
    dishes: payload.dishes.filter((d) => d.categoryId === cat.id),
  }))

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto">
      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        <SummaryChip icon={Layers} label={`${payload.categories.length} categorías`} />
        <SummaryChip icon={Tag}    label={`${totalDishes} platos con precios`} />
        {payload.detectedLocale && (
          <SummaryChip icon={CheckCircle2} label={`Locale: ${payload.detectedLocale}`} />
        )}
      </div>

      {/* Categories + dishes */}
      <div className="flex flex-col gap-4">
        {byCategory.map(({ cat, dishes }) => (
          <div key={cat.id}>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
              {cat.name}
            </p>
            <div className="flex flex-col gap-1">
              {dishes.map((dish) => (
                <div key={dish.id} className="flex items-baseline justify-between gap-2 rounded-lg bg-zinc-900/60 px-2.5 py-1.5">
                  <span className="truncate text-[12px] text-zinc-200">{dish.name}</span>
                  {dish.price && (
                    <span className="shrink-0 font-mono text-[11px] text-zinc-400">{dish.price}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SummaryChip({ icon: Icon, label }: { icon: React.ComponentType<{ size?: number }>; label: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
      <Icon size={11} />
      {label}
    </span>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MenuScannerModal({ tenantId, menuId, onClose }: MenuScannerModalProps) {
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)
  
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isDragOver, setIsDragOver] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [statusMsg, setStatusMsg] = useState('')
  const [payload, setPayload] = useState<GeminiMenuPayload | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // ── File handling ────────────────────────────────────────────────────────────

  async function processFiles(files: FileList | File[]): Promise<void> {
    setFileError(null)
    const filesArray = Array.from(files).slice(0, 5) // Max 5
    if (filesArray.length === 0) return

    for (const file of filesArray) {
      const err = validateFile(file)
      if (err) { setFileError(VALIDATION_MSGS[err]); return }
    }
    
    if (!GeminiApiService.isConfigured()) {
      setFileError('Falta la API key de Gemini. Añade VITE_GEMINI_API_KEY en tu archivo .env y reinicia el servidor.')
      return
    }

    try {
      setStep(2)
      setStatusMsg(`Analizando ${filesArray.length > 1 ? `${filesArray.length} imágenes` : 'imagen'}…`)
      
      const toAnalyze = await Promise.all(
        filesArray.map(async (file) => {
          const base64 = await fileToBase64(file)
          return { base64, mimeType: file.type }
        })
      )

      const extracted = await GeminiApiService.analyzeMenuImages(toAnalyze)
      setPayload(extracted)
      setStep(3)
    } catch (error) {
      setStep(1)
      const msg = error instanceof Error ? error.message : 'Error desconocido al analizar la imagen.'
      setFileError(msg)
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>): void {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      void processFiles(e.dataTransfer.files)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
    if (e.target.files && e.target.files.length > 0) {
      void processFiles(e.target.files)
    }
    e.target.value = ''
  }

  // ── Apply ────────────────────────────────────────────────────────────────────

  async function handleApply(): Promise<void> {
    if (!payload || !menuId) return
    setIsSaving(true)
    try {
      await importGeminiMenuToFirestore(tenantId, menuId, payload)
      await queryClient.invalidateQueries({ queryKey: ['dishes', tenantId] })
      await queryClient.invalidateQueries({ queryKey: ['categories', tenantId] })
      await queryClient.invalidateQueries({ queryKey: ['menus', tenantId] })
      onClose()
    } catch {
      setFileError('Error al guardar el menú. Intenta de nuevo.')
      setIsSaving(false)
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-800/60 shadow-[0_40px_100px_rgba(0,0,0,0.9)]" style={{ maxHeight: '90vh' }}>

        {/* ── Header ── */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-800/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15">
              <ScanSearch size={16} className="text-violet-400" />
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-zinc-100">Digitalizar Platos con IA</h2>
              <p className="text-[11px] text-zinc-500">Gemini importará los platos directo a tu menú</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSaving}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex min-h-0 flex-1 overflow-hidden">

          {/* STEP 1 — Upload */}
          {step === 1 && (
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
              {/* Drop zone */}
              <div
                role="button"
                tabIndex={0}
                aria-label="Zona de carga"
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                onDragLeave={() => setIsDragOver(false)}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
                className={[
                  'flex cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-dashed px-8 py-12 text-center transition-all',
                  isDragOver
                    ? 'border-violet-400 bg-violet-500/10'
                    : 'border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/40',
                ].join(' ')}
              >
                <div className={[
                  'flex h-16 w-16 items-center justify-center rounded-2xl transition-colors',
                  isDragOver ? 'bg-violet-500/20' : 'bg-zinc-900',
                ].join(' ')}>
                  {isDragOver
                    ? <UploadCloud size={30} className="text-violet-400" />
                    : <ImagePlus  size={30} className="text-zinc-600"   />
                  }
                </div>

                <div>
                  <p className="text-base font-semibold text-zinc-200">
                    {isDragOver ? 'Suelta aquí tu imagen' : 'Sube la foto de tu menú'}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Arrastra o haz clic · JPG, PNG, WebP o PDF · Máx. {MAX_SIZE_MB} MB
                  </p>
                </div>

                <span className="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 transition-colors">
                  Elegir archivo
                </span>

                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept={ACCEPTED_TYPES.join(',')}
                  onChange={handleFileChange}
                  className="sr-only"
                  aria-hidden="true"
                />
              </div>

              {/* Validation error */}
              {fileError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                  <AlertCircle size={15} className="shrink-0 text-red-400" />
                  <p className="text-sm text-red-400">{fileError}</p>
                </div>
              )}

              {/* Photo tips */}
              <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-600">
                  Consejos para mejores resultados
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 grid-cols-1">
                  {PHOTO_TIPS.map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-start gap-2.5 rounded-xl bg-zinc-900/60 p-3">
                      <Icon size={14} className="mt-0.5 shrink-0 text-zinc-500" />
                      <p className="text-[11px] leading-relaxed text-zinc-500">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 — Processing */}
          {step === 2 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-violet-500/20" style={{ animationDuration: '2s' }} />
                <Loader2 size={48} className="animate-spin text-violet-400" />
              </div>

              <div>
                <p className="text-lg font-semibold text-zinc-100">
                  {statusMsg}
                </p>
                <p className="mt-1.5 text-sm text-zinc-500">
                  Gemini está leyendo tu menú físico. Puede tardar unos segundos.
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-xs overflow-hidden rounded-full bg-zinc-900">
                <div
                  className="h-1.5 animate-pulse rounded-full bg-violet-500 transition-all duration-500"
                  style={{ width: '50%' }}
                />
              </div>
            </div>
          )}

          {/* STEP 3 — Preview & Save */}
          {step === 3 && payload && (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto px-5 py-4">
                 <PreviewPanel payload={payload} />
              </div>

              {/* Footer */}
              <div className="flex shrink-0 items-center justify-between border-t border-zinc-800/60 px-6 py-4">
                <button
                  onClick={() => { setPayload(null); setStep(1); setFileError(null); }}
                  disabled={isSaving}
                  className="text-sm text-zinc-500 transition-colors hover:text-zinc-300 disabled:opacity-50"
                >
                  ← Descartar
                </button>
                <button
                  onClick={() => void handleApply()}
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold bg-white text-zinc-900 hover:bg-zinc-100 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                >
                  {isSaving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <span>Añadir platos al menú</span>
                  )}
                  {!isSaving && <ChevronRight size={16} />}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
