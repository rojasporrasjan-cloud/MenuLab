import { useRef, useState }  from 'react'
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
import type { TemplateId }          from '@core/domain/entities/Tenant'
import { TEMPLATE_LIST }            from '@features/editor/templates/templateRegistry'
import type { TemplateDefinition }  from '@features/editor/templates/templateRegistry'
import { LIMITS }                   from '@shared/constants/limits'
import { useDigitalizeMenu }        from '@features/editor/hooks/useDigitalizeMenu'
import type { GeminiMenuPayload }   from '@features/editor/services/AIParserService'

// ─── Props ────────────────────────────────────────────────────────────────────

interface DigitalizarModalProps {
  readonly tenantId:  string
  readonly onClose:   () => void
}

// ─── File helpers ─────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]

const MAX_BYTES   = LIMITS.upload.maxFileSizeBytes
const MAX_SIZE_MB = MAX_BYTES / (1024 * 1024)

type ValidationError = 'TYPE_NOT_SUPPORTED' | 'FILE_TOO_LARGE'

const VALIDATION_MSGS: Record<ValidationError, string> = {
  TYPE_NOT_SUPPORTED: 'Solo se aceptan imágenes JPG, PNG, WebP o PDF.',
  FILE_TOO_LARGE:     `El archivo supera el límite de ${MAX_SIZE_MB} MB.`,
}

function validateFile(file: File): ValidationError | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return 'TYPE_NOT_SUPPORTED'
  if (file.size > MAX_BYTES)               return 'FILE_TOO_LARGE'
  return null
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader    = new FileReader()
    reader.onload   = () => {
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
              {dishes.slice(0, 6).map((dish) => (
                <div key={dish.id} className="flex items-baseline justify-between gap-2 rounded-lg bg-zinc-900/60 px-2.5 py-1.5">
                  <span className="truncate text-[12px] text-zinc-200">{dish.name}</span>
                  {dish.price && (
                    <span className="shrink-0 font-mono text-[11px] text-zinc-400">{dish.price}</span>
                  )}
                </div>
              ))}
              {dishes.length > 6 && (
                <p className="text-[10px] text-zinc-600 px-1">+{dishes.length - 6} más…</p>
              )}
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

// ─── Template picker (compact) ────────────────────────────────────────────────

interface TemplateMiniPickerProps {
  readonly selected:  TemplateId | null
  readonly onSelect:  (def: TemplateDefinition) => void
}

function TemplateMiniPicker({ selected, onSelect }: TemplateMiniPickerProps) {
  const [failedImages, setFailedImages] = useState<ReadonlySet<string>>(new Set())

  function handleImageError(id: string): void {
    setFailedImages((prev) => new Set([...prev, id]))
  }

  return (
    <div className="grid grid-cols-2 gap-2 overflow-y-auto">
      {TEMPLATE_LIST.map((def) => {
        const isActive    = selected === def.id
        const imgFailed   = failedImages.has(def.id)
        return (
          <button
            key={def.id}
            onClick={() => onSelect(def)}
            className={[
              'relative flex flex-col overflow-hidden rounded-xl border transition-all duration-150 text-left',
              isActive
                ? 'border-brand-500 ring-2 ring-brand-500/30'
                : 'border-zinc-800 hover:border-zinc-600',
            ].join(' ')}
          >
            {/* Thumbnail */}
            <div className="relative aspect-[3/4] w-full bg-zinc-900 overflow-hidden">
              {imgFailed ? (
                <div className="absolute inset-0 flex items-center justify-center p-2 text-center">
                  <span className="text-[10px] text-zinc-500">{def.name}</span>
                </div>
              ) : (
                <img
                  src={def.canvaTemplate.exportUrl}
                  alt={def.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={() => handleImageError(def.id)}
                />
              )}
              {isActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-brand-500/20">
                  <CheckCircle2 size={22} className="text-brand-400 drop-shadow" />
                </div>
              )}
            </div>
            {/* Label */}
            <div className="px-2 py-1.5">
              <p className="truncate text-[10px] font-semibold text-zinc-300">{def.name}</p>
              <p className="text-[9px] uppercase tracking-wide text-zinc-600">{def.category}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DigitalizarModal({ tenantId, onClose }: DigitalizarModalProps) {
  const inputRef                     = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver]  = useState(false)
  const [fileError, setFileError]    = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition | null>(
    TEMPLATE_LIST[0] ?? null,
  )

  const { status, extract, apply, reset } = useDigitalizeMenu(tenantId)

  const isProcessing = status.phase === 'extracting' || status.phase === 'applying'

  // ── File handling ────────────────────────────────────────────────────────────

  async function processFile(file: File): Promise<void> {
    setFileError(null)
    const err = validateFile(file)
    if (err) { setFileError(VALIDATION_MSGS[err]); return }
    try {
      const base64 = await fileToBase64(file)
      await extract(base64, file.type)
    } catch {
      setFileError('No se pudo leer el archivo. Intenta con otra imagen.')
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>): void {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) void processFile(file)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0]
    if (file) void processFile(file)
    e.target.value = ''
  }

  // ── Apply ────────────────────────────────────────────────────────────────────

  function handleApply(): void {
    if (!selectedTemplate) return
    apply(selectedTemplate.id, selectedTemplate.canvaTemplate)
  }

  // ── Step computation ─────────────────────────────────────────────────────────

  const step: 1 | 2 | 3 =
    status.phase === 'idle' || status.phase === 'error'   ? 1 :
    status.phase === 'extracting' || status.phase === 'applying' ? 2 :
    3

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-800/60 shadow-[0_40px_100px_rgba(0,0,0,0.9)]" style={{ maxHeight: '90vh' }}>

        {/* ── Header ── */}
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-800/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15">
              <ScanSearch size={16} className="text-violet-400" />
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-zinc-100">Digitalizar Menú con IA</h2>
              <p className="text-[11px] text-zinc-500">Gemini 1.5 Flash · Extracción automática de platos y precios</p>
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2">
            {([1, 2, 3] as const).map((s) => (
              <div key={s} className="flex items-center gap-1">
                <div className={[
                  'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold transition-all',
                  s === step
                    ? 'bg-violet-500 text-white'
                    : s < step
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-zinc-800 text-zinc-600',
                ].join(' ')}>
                  {s < step ? '✓' : s}
                </div>
                {s < 3 && <div className={['h-px w-4 transition-all', s < step ? 'bg-emerald-500/40' : 'bg-zinc-800'].join(' ')} />}
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
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
                onClick={() => !isProcessing && inputRef.current?.click()}
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

              {/* Error from previous attempt */}
              {status.phase === 'error' && (
                <div className="flex items-start justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-400" />
                    <p className="text-sm text-red-400">{status.message}</p>
                  </div>
                  <button onClick={reset} className="shrink-0 text-[11px] font-medium text-red-400 underline underline-offset-2 hover:text-red-300">
                    Reintentar
                  </button>
                </div>
              )}

              {/* Photo tips */}
              <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-600">
                  Consejos para mejores resultados
                </p>
                <div className="grid grid-cols-2 gap-2">
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
                {status.phase === 'extracting'
                  ? <Loader2  size={48} className="animate-spin text-violet-400" />
                  : <ScanSearch size={48} className="animate-pulse text-violet-400" />
                }
              </div>

              <div>
                <p className="text-lg font-semibold text-zinc-100">
                  {status.phase === 'extracting' ? 'Analizando imagen…' : 'Mapeando coordenadas…'}
                </p>
                <p className="mt-1.5 text-sm text-zinc-500">
                  {status.phase === 'extracting'
                    ? 'Gemini está leyendo tu menú físico. Puede tardar unos segundos.'
                    : 'Calculando la posición de cada platillo y precio en el lienzo.'}
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-xs overflow-hidden rounded-full bg-zinc-900">
                <div
                  className="h-1.5 animate-pulse rounded-full bg-violet-500 transition-all duration-500"
                  style={{ width: status.phase === 'applying' ? '90%' : '50%' }}
                />
              </div>
            </div>
          )}

          {/* STEP 3 — Preview + Template picker */}
          {step === 3 && status.phase !== 'done' && (
            <div className="flex min-h-0 flex-1 overflow-hidden">

              {/* Left — Extracted data */}
              <div className="flex w-[45%] shrink-0 flex-col overflow-hidden border-r border-zinc-800/60">
                <div className="shrink-0 border-b border-zinc-800/60 px-5 py-3.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                    Datos extraídos
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  {status.phase === 'preview' && (
                    <PreviewPanel payload={status.payload} />
                  )}
                </div>
              </div>

              {/* Right — Template picker */}
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="shrink-0 border-b border-zinc-800/60 px-5 py-3.5">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                    Elige el diseño de fondo
                  </h3>
                  <p className="mt-0.5 text-[10px] text-zinc-600">
                    La IA posicionará tus platos sobre este diseño
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-3">
                  <TemplateMiniPicker
                    selected={selectedTemplate?.id ?? null}
                    onSelect={setSelectedTemplate}
                  />
                </div>
              </div>

            </div>
          )}

          {/* Done state */}
          {status.phase === 'done' && (
            <div className="flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15">
                <CheckCircle2 size={32} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-lg font-semibold text-zinc-100">¡Menú digitalizado con éxito!</p>
                <p className="mt-1.5 text-sm text-zinc-500 max-w-sm">
                  Las capas se cargaron en el lienzo. Usa el panel de propiedades para ajustar posiciones y estilos.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { reset(); }}
                  className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
                >
                  Subir otra imagen
                </button>
                <button
                  onClick={onClose}
                  className="rounded-xl bg-white px-5 py-2 text-sm font-bold text-zinc-900 transition-colors hover:bg-zinc-100"
                >
                  Ver en el lienzo
                </button>
              </div>
            </div>
          )}

        </div>

        {/* ── Footer — only on step 3 ── */}
        {step === 3 && status.phase === 'preview' && (
          <div className="flex shrink-0 items-center justify-between border-t border-zinc-800/60 px-6 py-4">
            <button
              onClick={() => reset()}
              className="text-sm text-zinc-500 transition-colors hover:text-zinc-300"
            >
              ← Subir otra imagen
            </button>
            <button
              onClick={handleApply}
              disabled={!selectedTemplate}
              className={[
                'flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all',
                selectedTemplate
                  ? 'bg-white text-zinc-900 hover:bg-zinc-100 shadow-lg'
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed',
              ].join(' ')}
            >
              <span>Aplicar al lienzo</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
