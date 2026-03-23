import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ChevronLeft,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
} from 'lucide-react'
import { db } from '../db/database'
import {
  exportToJSON,
  importFromJSON,
  getLastBackupDate,
  daysSinceLastBackup,
} from '../utils/backupUtils'
import { formatDate } from '../utils/imageUtils'

export default function Backup() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    areas: number
    receipts: number
  } | null>(null)
  const [error, setError] = useState('')
  const [, forceUpdate] = useState(0)

  const receiptCount = useLiveQuery(() => db.receipts.count())
  const areaCount = useLiveQuery(() => db.areas.count())

  const lastBackup = getLastBackupDate()
  const days = daysSinceLastBackup()

  const handleExport = async () => {
    setExporting(true)
    setError('')
    setImportResult(null)
    try {
      await exportToJSON()
      forceUpdate((n) => n + 1)
    } catch {
      setError('Export misslyckades. Försök igen.')
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setError('')
    setImportResult(null)
    try {
      const result = await importFromJSON(file)
      setImportResult(result)
      forceUpdate((n) => n + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import misslyckades.')
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  const backupStatus = () => {
    if (!lastBackup) return { color: 'text-orange-500', label: 'Aldrig säkerhetskopierat' }
    if (days !== null && days >= 7) return { color: 'text-orange-500', label: `${days} dagar sedan` }
    return { color: 'text-green-600', label: days === 0 ? 'Idag' : `${days} dagar sedan` }
  }

  const status = backupStatus()

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-1 -ml-1 text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">Säkerhetskopiering</h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Status card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            Status
          </p>
          <div className="flex items-center gap-2 mb-3">
            <Clock className={`w-4 h-4 ${status.color}`} />
            <span className={`text-sm font-medium ${status.color}`}>
              Senaste backup: {status.label}
            </span>
          </div>
          {lastBackup && (
            <p className="text-xs text-gray-400">{formatDate(lastBackup)}</p>
          )}
          <div className="mt-3 pt-3 border-t border-gray-50 flex gap-4 text-sm text-gray-600">
            <span>
              <strong className="text-gray-900">{receiptCount ?? 0}</strong> kvitton
            </span>
            <span>
              <strong className="text-gray-900">{areaCount ?? 0}</strong> områden
            </span>
          </div>
        </div>

        {/* Feedback */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}
        {importResult && (
          <div className="flex items-start gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
            <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            Importerat: {importResult.receipts} kvitton och {importResult.areas} områden.
          </div>
        )}

        {/* Export */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-800 mb-1">Exportera</h2>
          <p className="text-sm text-gray-500 mb-4">
            Laddar ner en JSON-fil med alla kvitton, bilder och områden. Spara
            filen på ett säkert ställe — t.ex. iCloud, Google Drive eller din
            dator.
          </p>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl py-3 font-medium disabled:opacity-50 hover:bg-blue-700 active:bg-blue-800 transition-colors"
          >
            <Download className="w-5 h-5" />
            {exporting ? 'Exporterar...' : 'Ladda ner backup (JSON)'}
          </button>
        </div>

        {/* Import */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-800 mb-1">Importera</h2>
          <p className="text-sm text-gray-500 mb-4">
            Återställ från en tidigare sparad JSON-fil. Befintlig data bevaras —
            import lägger till och uppdaterar, raderar inte.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-gray-700 rounded-xl py-3 font-medium disabled:opacity-50 hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <Upload className="w-5 h-5" />
            {importing ? 'Importerar...' : 'Välj backup-fil'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImport}
            className="hidden"
          />
        </div>

        {/* Reminder tip */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
          <p className="font-medium mb-1">Tips</p>
          <p>
            Gör en backup en gång i veckan. iOS kan rensa lokal data om
            lagringsutrymmet är lågt eller om appen inte används på ett tag.
          </p>
        </div>
      </div>
    </div>
  )
}
