import { describe, it, expect } from 'vitest'
import { editorReducer } from '../editorReducer'
import { INITIAL_EDITOR_STATE } from '../../types/editor.types'
import type { EditorDocument, EditorState } from '../../types/editor.types'
import { defaultDataLayer } from '../../types/blocks.types'

function blankDoc(): EditorDocument {
  return {
    version: 2,
    tenantId: 't1',
    templateId: 'dark-modern',
    canvaTemplate: null,
    theme: {
      primaryColor: '#3b82f6',
      backgroundColor: '#ffffff',
      fontFamily: 'Inter',
      textScale: '1',
      imgRadius: '8',
    },
    dataLayers: [],
    updatedAt: '2026-06-14T00:00:00.000Z',
    publishedAt: null,
  }
}

function readyState(doc: EditorDocument): EditorState {
  return editorReducer(INITIAL_EDITOR_STATE, { type: 'LOAD_DOCUMENT', document: doc })
}

function layer(id: string) {
  return defaultDataLayer(id, { type: 'static', content: id })
}

describe('editorReducer — DataLayer CRUD', () => {
  it('ADD_LAYER agrega una capa y marca el documento como sucio', () => {
    const next = editorReducer(readyState(blankDoc()), { type: 'ADD_LAYER', layer: layer('l1') })
    expect(next.document?.dataLayers).toHaveLength(1)
    expect(next.document?.dataLayers[0]?.id).toBe('l1')
    expect(next.isDirty).toBe(true)
  })

  it('REMOVE_LAYER quita solo la capa indicada', () => {
    let state = readyState(blankDoc())
    state = editorReducer(state, { type: 'ADD_LAYER', layer: layer('l1') })
    state = editorReducer(state, { type: 'ADD_LAYER', layer: layer('l2') })
    const next = editorReducer(state, { type: 'REMOVE_LAYER', layerId: 'l1' })
    expect(next.document?.dataLayers.map((l) => l.id)).toEqual(['l2'])
  })

  it('TOGGLE_LAYER invierte la visibilidad', () => {
    let state = readyState(blankDoc())
    state = editorReducer(state, { type: 'ADD_LAYER', layer: layer('l1') })
    const before = state.document?.dataLayers[0]?.visible
    const next = editorReducer(state, { type: 'TOGGLE_LAYER', layerId: 'l1' })
    expect(next.document?.dataLayers[0]?.visible).toBe(!before)
  })

  it('REORDER_LAYERS reordena y reasigna zIndex por posición', () => {
    let state = readyState(blankDoc())
    state = editorReducer(state, { type: 'ADD_LAYER', layer: layer('a') })
    state = editorReducer(state, { type: 'ADD_LAYER', layer: layer('b') })
    const next = editorReducer(state, { type: 'REORDER_LAYERS', orderedIds: ['b', 'a'] })
    expect(next.document?.dataLayers.map((l) => l.id)).toEqual(['b', 'a'])
    expect(next.document?.dataLayers[0]?.position.zIndex).toBe(0)
    expect(next.document?.dataLayers[1]?.position.zIndex).toBe(1)
  })

  it('SET_THEME hace merge del tema sin pisar lo demás', () => {
    const next = editorReducer(readyState(blankDoc()), { type: 'SET_THEME', patch: { primaryColor: '#ff0000' } })
    expect(next.document?.theme.primaryColor).toBe('#ff0000')
    expect(next.document?.theme.backgroundColor).toBe('#ffffff')
  })
})

describe('editorReducer — Historial (undo/redo)', () => {
  it('UNDO revierte al documento anterior y REDO lo reaplica', () => {
    let state = readyState(blankDoc())
    state = editorReducer(state, { type: 'ADD_LAYER', layer: layer('l1') })
    expect(state.document?.dataLayers).toHaveLength(1)

    const undone = editorReducer(state, { type: 'UNDO' })
    expect(undone.document?.dataLayers).toHaveLength(0)

    const redone = editorReducer(undone, { type: 'REDO' })
    expect(redone.document?.dataLayers).toHaveLength(1)
  })

  it('UNDO sin historial deja el estado igual', () => {
    const state = readyState(blankDoc())
    expect(editorReducer(state, { type: 'UNDO' })).toBe(state)
  })
})
