import Dexie, { type Table } from 'dexie'
import type { Area, Receipt } from '../types'

class ReceiptDB extends Dexie {
  areas!: Table<Area>
  receipts!: Table<Receipt>

  constructor() {
    super('receipt-logg')
    this.version(1).stores({
      areas: 'id, name, type, createdAt',
      receipts: 'id, areaId, date, createdAt',
    })
  }
}

export const db = new ReceiptDB()
