import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Search, Receipt as ReceiptIcon, CheckCircle2, Circle, FileDown, X } from 'lucide-react'
import { db } from '../db/database'
import ReceiptCard from '../components/ReceiptCard'
import type { Area } from '../types'

function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export default function Receipts() {
  const [search, setSearch] = useState('')
  const [selectedAreaId, setSelectedAreaId] = useState('')
  const [selectionMode, setSelectionMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [exporting, setExporting] = useState(false)

  // Pre-load PDF module as soon as selection mode activates,
  // so the module is cached before the user taps export
  useEffect(() => {
    if (selectionMode) {
      import('../utils/pdfExport')
    }
  }, [selectionMode])

  const areas = useLiveQuery(() => db.areas.toArray())

  const receipts = useLiveQuery(async () => {
    const all = await db.receipts.orderBy('date').reverse().toArray()
    return all.filter((r) => {
      const matchesArea = !selectedAreaId || r.areaId === selectedAreaId
      const matchesSearch =
        !search || r.notes.toLowerCase().includes(search.toLowerCase())
      return matchesArea && matchesSearch
    })
  }, [search, selectedAreaId])

  const areaMap = new Map<string, Area>(areas?.map((a) => [a.id, a]))

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAll = () => {
    setSelected(new Set(receipts?.map((r) => r.id) ?? []))
  }

  const exitSelectionMode = () => {
    setSelectionMode(false)
    setSelected(new Set())
  }

  const handleExport = async () => {
    if (selected.size === 0 || !receipts) return
    setExporting(true)

    // iOS Safari blocks downloads triggered after async work.
    // Open the target window synchronously NOW (within the tap gesture),
    // then navigate it to the blob URL once the PDF is ready.
    const targetWindow = isIOS() ? window.open('', '_blank') : null

    try {
      const toExport = receipts.filter((r) => selected.has(r.id))
      const { exportReceiptsToPDF } = await import('../utils/pdfExport')
      await exportReceiptsToPDF(toExport, areaMap, targetWindow)
    } catch (err) {
      targetWindow?.close()
      console.error('PDF export failed', err)
      alert('Något gick fel vid PDF-exporten. Försök igen.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Sticky header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-3 sticky top-0 z-10">
        {selectionMode ? (
          /* Selection mode header */
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={selectAll}
              className="text-sm text-blue-600 font-medium hover:text-blue-700"
            >
              Välj alla
            </button>
            <span className="text-sm font-semibold text-gray-700">
              {selected.size} {selected.size === 1 ? 'vald' : 'valda'}
            </span>
            <button
              onClick={exitSelectionMode}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
              Avbryt
            </button>
          </div>
        ) : (
          /* Normal header */
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900">Kvitton</h1>
            <button
              onClick={() => setSelectionMode(true)}
              className="text-sm text-blue-600 font-medium hover:text-blue-700 px-2 py-1"
            >
              Välj
            </button>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Sök noteringar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Area filter chips */}
        {areas && areas.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setSelectedAreaId('')}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                !selectedAreaId
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Alla
            </button>
            {areas.map((area) => (
              <button
                key={area.id}
                onClick={() =>
                  setSelectedAreaId(area.id === selectedAreaId ? '' : area.id)
                }
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedAreaId === area.id
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={
                  selectedAreaId === area.id ? { backgroundColor: area.color } : {}
                }
              >
                {area.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Receipt list */}
      <div className="px-4 py-4 space-y-2">
        {receipts?.map((receipt) => (
          <div key={receipt.id} className="relative">
            {selectionMode ? (
              /* Selectable wrapper */
              <button
                onClick={() => toggleSelect(receipt.id)}
                className="w-full text-left"
              >
                <div
                  className={`rounded-xl transition-all ${
                    selected.has(receipt.id)
                      ? 'ring-2 ring-blue-500 ring-offset-1'
                      : ''
                  }`}
                >
                  <div className="pointer-events-none">
                    <ReceiptCard receipt={receipt} area={areaMap.get(receipt.areaId)} />
                  </div>
                </div>
                {/* Checkbox indicator */}
                <div className="absolute top-3 right-3 z-10">
                  {selected.has(receipt.id) ? (
                    <CheckCircle2 className="w-6 h-6 text-blue-600 drop-shadow-sm" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-300 drop-shadow-sm" />
                  )}
                </div>
              </button>
            ) : (
              <ReceiptCard receipt={receipt} area={areaMap.get(receipt.areaId)} />
            )}
          </div>
        ))}

        {receipts?.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <ReceiptIcon className="w-16 h-16 mx-auto mb-3 opacity-25" />
            <p className="font-medium text-gray-500">Inga kvitton hittades</p>
            {(search || selectedAreaId) && (
              <p className="text-sm mt-1">Prova ett annat filter</p>
            )}
          </div>
        )}
      </div>

      {/* Export action bar (shown in selection mode) */}
      {selectionMode && (
        <div className="fixed bottom-16 left-0 right-0 z-40 px-4">
          <div className="max-w-lg mx-auto">
            <button
              onClick={handleExport}
              disabled={selected.size === 0 || exporting}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl py-3 font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 active:bg-blue-800 transition-colors"
            >
              <FileDown className="w-5 h-5" />
              {exporting
                ? 'Genererar PDF...'
                : selected.size === 0
                  ? 'Välj kvitton att exportera'
                  : `Exportera ${selected.size} kvitto${selected.size > 1 ? 'n' : ''} till PDF`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
