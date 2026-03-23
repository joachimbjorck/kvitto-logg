import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronLeft, Trash2, Edit2, Save, X, Camera, Upload } from 'lucide-react'
import { db } from '../db/database'
import { formatDate, formatAmount, compressImage } from '../utils/imageUtils'
import type { AreaType } from '../types'
import { AREA_TYPE_LABELS, AREA_COLORS } from '../types'

export default function ReceiptDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [editing, setEditing] = useState(false)
  const [editNotes, setEditNotes] = useState('')
  const [editAreaId, setEditAreaId] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editCurrency, setEditCurrency] = useState('SEK')
  const [editDate, setEditDate] = useState('')
  const [editImage, setEditImage] = useState('')

  const receipt = useLiveQuery(() => (id ? db.receipts.get(id) : undefined), [id])
  const areas = useLiveQuery(() => db.areas.toArray())
  const area = areas?.find((a) => a.id === receipt?.areaId)

  const startEdit = () => {
    if (!receipt) return
    setEditNotes(receipt.notes)
    setEditAreaId(receipt.areaId)
    setEditAmount(receipt.amount?.toString() ?? '')
    setEditCurrency(receipt.currency)
    setEditDate(new Date(receipt.date).toISOString().split('T')[0])
    setEditImage(receipt.imageData)
    setEditing(true)
  }

  const handleSave = async () => {
    if (!id) return
    await db.receipts.update(id, {
      notes: editNotes,
      areaId: editAreaId,
      amount: editAmount ? parseFloat(editAmount.replace(',', '.')) : undefined,
      currency: editCurrency,
      date: new Date(editDate),
      imageData: editImage,
    })
    setEditing(false)
  }

  const handleDelete = async () => {
    if (!id || !confirm('Ta bort detta kvitto permanent?')) return
    await db.receipts.delete(id)
    navigate('/kvitton')
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const compressed = await compressImage(file)
    setEditImage(compressed)
  }

  const openCamera = () => {
    if (!fileInputRef.current) return
    fileInputRef.current.setAttribute('capture', 'environment')
    fileInputRef.current.value = ''
    fileInputRef.current.click()
  }

  const openGallery = () => {
    if (!fileInputRef.current) return
    fileInputRef.current.removeAttribute('capture')
    fileInputRef.current.value = ''
    fileInputRef.current.click()
  }

  if (receipt === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (receipt === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-400 gap-3">
        <p>Kvittot hittades inte.</p>
        <button onClick={() => navigate('/kvitton')} className="text-blue-600 text-sm">
          Tillbaka
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-1 -ml-1 text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Kvitto</h1>
        </div>
        <div className="flex gap-1">
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
              <button onClick={handleSave} className="p-2 text-blue-600 hover:text-blue-700">
                <Save className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={startEdit}
                className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-gray-500 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Image */}
        <div className="relative bg-gray-100 rounded-xl overflow-hidden">
          <img
            src={editing ? editImage : receipt.imageData}
            alt="Kvitto"
            className="w-full object-contain max-h-80"
          />
          {editing && (
            <div className="absolute bottom-3 right-3 flex gap-2">
              <button
                onClick={openCamera}
                className="bg-blue-600 text-white p-2 rounded-lg shadow-lg hover:bg-blue-700"
                title="Kamera"
              >
                <Camera className="w-4 h-4" />
              </button>
              <button
                onClick={openGallery}
                className="bg-white text-gray-700 p-2 rounded-lg shadow-lg hover:bg-gray-50"
                title="Galleri"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="hidden"
        />

        {/* Detail card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-50">
          {/* Area */}
          <div className="p-4">
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
              Område
            </p>
            {editing ? (
              <div className="flex flex-wrap gap-2">
                {areas?.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setEditAreaId(a.id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium border-2 transition-all ${
                      editAreaId === a.id
                        ? 'text-white border-transparent'
                        : 'bg-white border-gray-200 text-gray-700'
                    }`}
                    style={
                      editAreaId === a.id
                        ? { backgroundColor: a.color, borderColor: a.color }
                        : {}
                    }
                  >
                    {a.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {area ? (
                  <>
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: area.color }}
                    />
                    <span className="font-medium text-gray-900">{area.name}</span>
                    <span className="text-xs text-gray-400">
                      ({AREA_TYPE_LABELS[area.type as AreaType]})
                    </span>
                  </>
                ) : (
                  <span className="text-gray-400 italic">Inget område kopplat</span>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="p-4">
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
              Notering
            </p>
            {editing ? (
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            ) : (
              <p className="text-gray-900">{receipt.notes || '—'}</p>
            )}
          </div>

          {/* Date */}
          <div className="p-4">
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
              Datum
            </p>
            {editing ? (
              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">{formatDate(receipt.date)}</p>
            )}
          </div>

          {/* Amount */}
          <div className="p-4">
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
              Belopp
            </p>
            {editing ? (
              <div className="flex gap-2">
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  placeholder="0"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={editCurrency}
                  onChange={(e) => setEditCurrency(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="SEK">SEK</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="NOK">NOK</option>
                  <option value="DKK">DKK</option>
                  <option value="GBP">GBP</option>
                  <option value="CHF">CHF</option>
                </select>
              </div>
            ) : (
              <p className="text-gray-900">
                {receipt.amount !== undefined && receipt.amount > 0
                  ? formatAmount(receipt.amount, receipt.currency)
                  : '—'}
              </p>
            )}
          </div>

          {/* Color picker in edit mode for area color hint */}
          {editing && (
            <div className="p-4">
              <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                Färg (för nytt område)
              </p>
              <div className="flex gap-2 flex-wrap">
                {AREA_COLORS.map((color) => (
                  <div
                    key={color}
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Hantera färger under Områden-fliken
              </p>
            </div>
          )}
        </div>

        <p className="text-xs text-center text-gray-400">
          Sparat {formatDate(receipt.createdAt)}
        </p>
      </div>
    </div>
  )
}
