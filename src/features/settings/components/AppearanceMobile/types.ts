import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/** Una "herramienta" del editor: una pestaña del toolbar inferior con su panel. */
export interface EditorTool {
  readonly id: string
  readonly label: string
  readonly icon: LucideIcon
  /** Controles que se muestran en el bottom-sheet al activar la herramienta. */
  readonly content: ReactNode
}
