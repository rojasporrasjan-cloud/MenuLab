import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  orderBy,
  query,
  limit,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@infrastructure/firebase/firestore'
import type { IEditorPersistenceService } from '@features/editor/persistence/IEditorPersistenceService'
import { PersistenceError } from '@features/editor/persistence/IEditorPersistenceService'
import type { EditorDocument, EditorSnapshot } from '@features/editor/types/editor.types'
import { PATHS } from '@shared/constants/firestore-paths'
import { LIMITS } from '@shared/constants/limits'

// ─── Firebase implementation ──────────────────────────────────────────────────
//
// All reads and writes are scoped to tenantId — no cross-tenant access is possible
// because every Firestore path is constructed via PATHS which requires tenantId.

export class FirebaseEditorPersistenceService implements IEditorPersistenceService {

  // ── Published ─────────────────────────────────────────────────────────────

  async loadPublished(tenantId: string): Promise<EditorDocument | null> {
    try {
      const ref = doc(db, PATHS.editor.published(tenantId))
      const snap = await getDoc(ref)
      if (!snap.exists()) return null
      // safe: Firestore document mirrors EditorDocument schema written by this service
      return snap.data() as EditorDocument
    } catch (err) {
      if (isPermissionDenied(err)) return null
      throw toError('network-error', 'Failed to load published document', err)
    }
  }

  async publish(tenantId: string, document: EditorDocument): Promise<void> {
    assertTenantMatch(tenantId, document.tenantId)
    try {
      const ref = doc(db, PATHS.editor.published(tenantId))
      await setDoc(ref, { ...document, _updatedAt: serverTimestamp() })
    } catch (err) {
      if (isPermissionDenied(err)) throw toError('permission-denied', 'Sin permisos — añade tu usuario al tenant en Firestore Console', err)
      throw toError('network-error', 'Failed to publish document', err)
    }
  }

  // ── Drafts ────────────────────────────────────────────────────────────────

  async saveDraft(tenantId: string, snapshot: EditorSnapshot): Promise<void> {
    assertTenantMatch(tenantId, snapshot.document.tenantId)
    try {
      const ref = doc(db, PATHS.editor.draft(tenantId, snapshot.id))
      await setDoc(ref, { ...snapshot, _savedAt: serverTimestamp() })
      await this.pruneOldDrafts(tenantId, LIMITS.editor.maxSnapshots)
    } catch (err) {
      if (isPermissionDenied(err)) throw toError('permission-denied', 'Sin permisos — añade tu usuario al tenant en Firestore Console', err)
      throw toError('network-error', 'Failed to save draft', err)
    }
  }

  async loadDrafts(tenantId: string): Promise<readonly EditorSnapshot[]> {
    try {
      const ref = collection(db, PATHS.editor.drafts(tenantId))
      const q = query(ref, orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      // safe: Firestore documents mirror EditorSnapshot schema written by saveDraft
      return snap.docs.map(d => d.data() as EditorSnapshot)
    } catch (err) {
      throw toError('network-error', 'Failed to load drafts', err)
    }
  }

  async loadLatestDraft(tenantId: string): Promise<EditorDocument | null> {
    try {
      const ref = collection(db, PATHS.editor.drafts(tenantId))
      const q = query(ref, orderBy('createdAt', 'desc'), limit(1))
      const snap = await getDocs(q)
      if (snap.empty) return null
      // safe: Firestore document mirrors EditorSnapshot schema written by saveDraft
      const snapshot = snap.docs[0]?.data() as EditorSnapshot
      return snapshot.document
    } catch (err) {
      if (isPermissionDenied(err)) return null
      throw toError('network-error', 'Failed to load latest draft', err)
    }
  }

  async deleteDraft(tenantId: string, snapshotId: string): Promise<void> {
    try {
      const ref = doc(db, PATHS.editor.draft(tenantId, snapshotId))
      await deleteDoc(ref)
    } catch (err) {
      throw toError('network-error', 'Failed to delete draft', err)
    }
  }

  async pruneOldDrafts(tenantId: string, keepCount: number): Promise<void> {
    try {
      const ref = collection(db, PATHS.editor.drafts(tenantId))
      const q = query(ref, orderBy('createdAt', 'desc'))
      const snap = await getDocs(q)
      const toDelete = snap.docs.slice(keepCount)
      await Promise.all(toDelete.map(d => deleteDoc(d.ref)))
    } catch (err) {
      throw toError('network-error', 'Failed to prune old drafts', err)
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toError(
  code: PersistenceError['code'],
  message: string,
  cause: unknown
): PersistenceError {
  return new PersistenceError(code, message, cause)
}

function isPermissionDenied(err: unknown): boolean {
  if (typeof err !== 'object' || err === null || !('code' in err)) return false
  // safe: Firebase FirebaseError exposes a `code` string property; narrowed above
  return (err as { code: string }).code === 'permission-denied'
}

function assertTenantMatch(pathTenantId: string, documentTenantId: string): void {
  if (pathTenantId !== documentTenantId) {
    throw new PersistenceError(
      'permission-denied',
      `Tenant mismatch: path=${pathTenantId} document=${documentTenantId}`
    )
  }
}
