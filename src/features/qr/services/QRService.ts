import { httpsCallable } from 'firebase/functions'
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { functions } from '@infrastructure/firebase/functions'
import { db } from '@infrastructure/firebase/firestore'
import { firestorePaths } from '@infrastructure/firebase/paths'
import { TableMapper } from '@infrastructure/mappers/TableMapper'
import type { Table } from '@core/domain/entities/Table'
import type { GenerateQRPayload, GenerateQRResult, TableFormValues } from '../types/qr.types'

const generateQRCallable = httpsCallable<GenerateQRPayload, GenerateQRResult>(
  functions,
  'generateQRCode',
)

export class QRService {
  static async getTables(tenantId: string): Promise<Table[]> {
    const q = query(
      collection(db, firestorePaths.tables(tenantId)),
      orderBy('number', 'asc'),
    )
    const snap = await getDocs(q)
    return snap.docs.map((doc) => TableMapper.toDomain(doc, tenantId))
  }

  static async createTable(
    tenantId: string,
    values: TableFormValues,
  ): Promise<Table> {
    const ref = await addDoc(collection(db, firestorePaths.tables(tenantId)), {
      tenantId,
      menuId: values.menuId,
      number: values.number,
      label: values.label || null,
      status: 'active',
      qrCodeUrl: null,
      qrMenuUrl: null,
      qrGeneratedAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return {
      id: ref.id,
      tenantId,
      menuId: values.menuId,
      number: values.number,
      label: values.label || null,
      status: 'active',
      qrCodeUrl: null,
      qrMenuUrl: null,
      qrGeneratedAt: null,
      createdAt: new Date(),
    }
  }

  static async updateTable(
    tenantId: string,
    tableId: string,
    values: Partial<TableFormValues>,
  ): Promise<void> {
    const { doc, updateDoc } = await import('firebase/firestore')
    const ref = doc(db, firestorePaths.tables(tenantId), tableId)
    await updateDoc(ref, {
      ...values,
      updatedAt: serverTimestamp(),
    })
  }

  static async generateQR(payload: GenerateQRPayload): Promise<string> {
    const result = await generateQRCallable(payload)
    return result.data.qrCodeUrl
  }
}
