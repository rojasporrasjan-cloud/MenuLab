import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
  limit,
} from 'firebase/firestore'
import { db } from '@infrastructure/firebase/firestore'
import { firestorePaths } from '@infrastructure/firebase/paths'
import { TenantMapper } from '@infrastructure/mappers/TenantMapper'
import type { ITenantRepository } from '@core/domain/repositories/ITenantRepository'
import type { Tenant } from '@core/domain/entities/Tenant'
import { NotFoundError } from '@core/errors/NotFoundError'

export class FirestoreTenantRepository implements ITenantRepository {
  async getById(tenantId: string): Promise<Tenant> {
    const snap = await getDoc(doc(db, firestorePaths.tenant(tenantId)))
    if (!snap.exists()) throw new NotFoundError('Tenant', tenantId)
    return TenantMapper.toDomain(snap)
  }

  async getBySlug(slug: string): Promise<Tenant> {
    const q = query(
      collection(db, firestorePaths.tenants()),
      where('slug', '==', slug),
      limit(1),
    )
    const snap = await getDocs(q)
    const first = snap.docs[0]
    if (snap.empty || !first) throw new NotFoundError('Tenant', slug)
    return TenantMapper.toDomain(first)
  }

  async getAll(): Promise<Tenant[]> {
    const q = query(
      collection(db, firestorePaths.tenants()),
      orderBy('createdAt', 'desc'),
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => TenantMapper.toDomain(d))
  }
}
