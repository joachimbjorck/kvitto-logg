import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Trash2, FolderOpen, X, Check } from 'lucide-react'
import { db } from '../db/database'
import type { Area, AreaType } from '../types'
import { AREA_TYPE_LABELS, AREA_COLORS } from '../types'

interface FormData {
  name: string
  type: AreaType
  color: string
}

const defaultForm: FormData = {
  name: '',
  type: 'övrigt',
  color: AREA_COLORS[0],
}

export default function Areas() {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormData>(defaultForm)
  const [saving, setSaving] = useState(false)

  const areas = useLiveQuery(() => db.areas.orderBy('createdAt').toArray())

  const receiptCounts = useLiveQuery(async () => {
    const all = await db.receipts.toArray()
    const counts: Record<string, number> = {}
    for (const r of all) {
      counts[r.areaId] = (counts[r.areaId] ?? 0) + 1
    }
    return counts
  })

  const handleAdd = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    await db.areas.add({
      id: crypto.randomUUID(),
      name: form.name.trim(),
      type: form.type,
      color: form.color,
      createdAt: new Date(),
    })
    setForm(defaultForm)
    setShowForm(false)
    setSaving(false)
  }

  const handleDelete = async (area: Area) => {
    const count = receiptCounts?.[area.id] ?? 0
    if (
      count > 0 &&
      !confirm(
        `"${area.name}" har ${count} kvitto${count > 1 ? 'n' : ''}. Vill du ändå ta bort området?`,
      )
    ) {
      return
    }
    await db.areas.delete(area.id)
  }

  return (
    <div className="min-h-screen pb-24">
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Områden</h1>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Nytt
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Add form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Nytt område</h2>
              <button
                onClick={() => {
                  setShowForm(false)
                  setForm(defaultForm)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Namn <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="t.ex. Mitt AB, Ridklubben, Anställning på Volvo..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Typ</label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, type: e.target.value as AreaType }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {Object.entries(AREA_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Färg</label>
                <div className="flex gap-2 flex-wrap">
                  {AREA_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setForm((f) => ({ ...f, color }))}
                      className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: color }}
                      title={color}
                    >
                      {form.color === color && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAdd}
                disabled={!form.name.trim() || saving}
                className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors"
              >
                {saving ? 'Sparar...' : 'Lägg till område'}
              </button>
            </div>
          </div>
        )}

        {/* Area list */}
        {areas?.map((area) => (
          <div
            key={area.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3"
          >
            <div
              className="w-11 h-11 rounded-full flex-shrink-0 shadow-sm"
              style={{ backgroundColor: area.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{area.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {AREA_TYPE_LABELS[area.type]} ·{' '}
                {receiptCounts?.[area.id] ?? 0} kvitto
                {(receiptCounts?.[area.id] ?? 0) !== 1 ? 'n' : ''}
              </p>
            </div>
            <button
              onClick={() => handleDelete(area)}
              className="p-2 text-gray-300 hover:text-red-500 transition-colors"
              title="Ta bort"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {areas?.length === 0 && !showForm && (
          <div className="text-center py-14 text-gray-400">
            <FolderOpen className="w-16 h-16 mx-auto mb-3 opacity-25" />
            <p className="font-medium text-gray-500">Inga områden ännu</p>
            <p className="text-sm mt-1">
              Skapa ett område för t.ex. ett företag, en anställning eller en förening
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
