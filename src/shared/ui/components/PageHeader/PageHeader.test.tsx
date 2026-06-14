// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Wallet } from 'lucide-react'
import { PageHeader } from './PageHeader'

describe('PageHeader', () => {
  it('renderiza el título y el eyebrow', () => {
    render(<PageHeader eyebrow="Operación" title="Pedidos" />)
    expect(screen.getByRole('heading', { name: 'Pedidos' })).toBeInTheDocument()
    expect(screen.getByText('Operación')).toBeInTheDocument()
  })

  it('renderiza subtítulo y acciones cuando se pasan', () => {
    render(<PageHeader title="Caja" subtitle="Arqueo del turno" actions={<button>Cerrar</button>} />)
    expect(screen.getByText('Arqueo del turno')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument()
  })

  it('omite eyebrow y subtítulo cuando no se pasan', () => {
    render(<PageHeader title="Solo título" icon={Wallet} />)
    expect(screen.getByRole('heading', { name: 'Solo título' })).toBeInTheDocument()
    expect(screen.queryByText('Operación')).not.toBeInTheDocument()
  })
})
