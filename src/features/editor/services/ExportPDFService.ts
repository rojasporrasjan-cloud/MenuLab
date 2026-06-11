import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

import type { EditorDocument } from '@features/editor/types/editor.types'

// ─── Format registry ──────────────────────────────────────────────────────────

type PDFFormat = 'a4' | 'carta'

interface PDFFormatSpec {
  readonly widthPt:  number
  readonly heightPt: number
}

// Points (1pt = 1/72 inch) — the native unit of jsPDF
const PDF_FORMATS: Readonly<Record<PDFFormat, PDFFormatSpec>> = {
  a4:    { widthPt: 595.28, heightPt: 841.89 },
  carta: { widthPt: 612,    heightPt: 792    },
}

// 3× capture scale: 400px canvas → 1200px bitmap, nítido en impresión A3
const CAPTURE_SCALE = 3

// ─── Geometry ─────────────────────────────────────────────────────────────────
//
// Centers the captured bitmap inside the PDF page using uniform letterboxing.
// When canvas and page share the same A4 ratio (1:√2), both offsets are 0.

interface FitResult {
  readonly widthPt:  number
  readonly heightPt: number
  readonly xPt:      number
  readonly yPt:      number
}

function fitInsidePage(
  canvasW: number,
  canvasH: number,
  spec:    PDFFormatSpec,
): FitResult {
  const canvasAspect = canvasW / canvasH
  const pageAspect   = spec.widthPt / spec.heightPt

  let imgW: number
  let imgH: number

  if (canvasAspect > pageAspect) {
    imgW = spec.widthPt
    imgH = spec.widthPt / canvasAspect
  } else {
    imgH = spec.heightPt
    imgW = spec.heightPt * canvasAspect
  }

  return {
    widthPt:  imgW,
    heightPt: imgH,
    xPt:      (spec.widthPt  - imgW) / 2,
    yPt:      (spec.heightPt - imgH) / 2,
  }
}

// ─── Filename ─────────────────────────────────────────────────────────────────

function safeFilename(tenantId: string): string {
  return (tenantId
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 60) || 'menu') + '_menu.pdf'
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class ExportPDFService {
  static async exportToPDF(
    elementId: string,
    document:  EditorDocument | null,
    format:    PDFFormat = 'a4',
  ): Promise<void> {
    if (!document) {
      throw new Error('No hay documento cargado para exportar.')
    }

    const element = window.document.getElementById(elementId)
    if (!element) {
      throw new Error(`Contenedor del editor con ID "${elementId}" no fue encontrado en el DOM.`)
    }

    let canvas: HTMLCanvasElement
    try {
      canvas = await html2canvas(element, {
        scale:           CAPTURE_SCALE,
        useCORS:         true,   // required: Canva background from Firebase Storage
        allowTaint:      false,
        backgroundColor: '#000000',
        logging:         false,
        imageTimeout:    15_000,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al capturar el lienzo'
      throw new Error(`Captura fallida: ${msg}`, { cause: err })
    }

    try {
      const spec  = PDF_FORMATS[format]
      const { widthPt, heightPt, xPt, yPt } = fitInsidePage(canvas.width, canvas.height, spec)

      const pdf = new jsPDF({
        orientation: spec.heightPt >= spec.widthPt ? 'portrait' : 'landscape',
        unit:        'pt',
        format:      [spec.widthPt, spec.heightPt],
        compress:    true,
      })

      const imgData = canvas.toDataURL('image/png')
      pdf.addImage(imgData, 'PNG', xPt, yPt, widthPt, heightPt, undefined, 'FAST')
      pdf.save(safeFilename(document.tenantId))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al generar el PDF'
      throw new Error(`Exportación fallida: ${msg}`, { cause: err })
    }
  }
}
