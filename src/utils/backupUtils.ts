import { db } from '../db/database'
import type { Area, Receipt } from '../types'

interface BackupData {
  version: 1
  exportedAt: string
  areas: Area[]
  receipts: Receipt[]
}

export async function exportToJSON(): Promise<void> {
  const [areas, receipts] = await Promise.all([
    db.areas.toArray(),
    db.receipts.toArray(),
  ])

  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    areas,
    receipts,
  }

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `kvitto-logg-backup-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  localStorage.setItem('lastBackupDate', new Date().toISOString())
}

export async function importFromJSON(
  file: File,
): Promise<{ areas: number; receipts: number }> {
  const text = await file.text()
  let backup: BackupData

  try {
    backup = JSON.parse(text)
  } catch {
    throw new Error('Filen är inte giltig JSON')
  }

  if (backup.version !== 1 || !Array.isArray(backup.areas) || !Array.isArray(backup.receipts)) {
    throw new Error('Okänt backup-format')
  }

  // Restore Date objects (JSON serializes them as strings)
  const areas = backup.areas.map((a) => ({
    ...a,
    createdAt: new Date(a.createdAt),
  }))
  const receipts = backup.receipts.map((r) => ({
    ...r,
    date: new Date(r.date),
    createdAt: new Date(r.createdAt),
  }))

  // bulkPut overwrites existing records with same id, adds new ones
  await db.areas.bulkPut(areas)
  await db.receipts.bulkPut(receipts)

  localStorage.setItem('lastBackupDate', new Date().toISOString())

  return { areas: areas.length, receipts: receipts.length }
}

export function getLastBackupDate(): Date | null {
  const stored = localStorage.getItem('lastBackupDate')
  return stored ? new Date(stored) : null
}

export function daysSinceLastBackup(): number | null {
  const last = getLastBackupDate()
  if (!last) return null
  return Math.floor((Date.now() - last.getTime()) / (1000 * 60 * 60 * 24))
}
