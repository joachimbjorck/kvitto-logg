import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Camera, Upload, X, Save, ChevronLeft } from 'lucide-react'
import { db } from '../db/database'
import { compressImage } from '../utils/imageUtils'

export default function AddReceipt() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const areas = useLiveQuery(() => db.areas.toArray())

  const [imageData, setImageData] = useState('')
  const [notes, setNotes] = useState('')
  const [areaId, setAreaId] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('SEK')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    try {
      const compressed = await compressImage(file)
      setImageData(compressed)
    } catch {
      setError('Kunde inte bearbeta bilden. Försök igen.')
    }
  }

  const handleSave = async () => {
    if (!imageData) {
      setError('Lägg till ett foto av kvittot')
      return
    }
    if (!areaId) {
      setError('Välj ett område')
      return
    }
    setSaving(true)
    try {
      await db.receipts.add({
        id: crypto.randomUUID(),
        imageData,
        notes,
        areaId,
        amount: amount ? parseFloat(amount.replace(',', '.')) : undefined,
        currency,
        date: new Date(date),
        createdAt: new Date(),
      })
      navigate('/kvitton')
    } catch {
      setError('Kunde inte spara kvittot. Försök igen.')
      setSaving(false)
    }
  }

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
        <h1 className="text-xl font-bold text-gray-900">Lägg till kvitto</h1>
      </div>

      <div className="px-4 py-4 space-y-5">
        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Image capture */}
        {imageData ? (
          <div className="relative">
            <img
              src={imageData}
              alt="Kvitto"
              className="w-full max-h-72 object-contain rounded-xl bg-gray-100"
            />
            <button
              onClick={() => setImageData('')}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">
            <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-4">Fota eller välj bild av kvittot</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={openCamera}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                <Camera className="w-4 h-4" />
                Kamera
              </button>
              <button
                onClick={openGallery}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                <Upload className="w-4 h-4" />
                Galleri
              </button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Område <span className="text-red-500">*</span>
          </label>
          {areas && areas.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {areas.map((area) => (
                <button
                  key={area.id}
                  onClick={() => setAreaId(area.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all ${
                    areaId === area.id
                      ? 'text-white border-transparent'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                  style={
                    areaId === area.id
                      ? { backgroundColor: area.color, borderColor: area.color }
                      : {}
                  }
                >
                  {area.name}
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-gray-600">
              Du har inga områden ännu.{' '}
              <button
                onClick={() => navigate('/omraden')}
                className="text-blue-600 font-medium underline"
              >
                Skapa ett område
              </button>{' '}
              innan du lägger till ett kvitto.
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Notering</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Vad gäller kvittot? (t.ex. Lunch med kund, Kontorstillbehör...)"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Datum</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Belopp <span className="text-gray-400 font-normal">(valfritt)</span>
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              inputMode="decimal"
              min="0"
              step="0.01"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
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
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving || !imageData || !areaId}
          className="w-full bg-blue-600 text-white rounded-xl py-3 flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 active:bg-blue-800 transition-colors"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Sparar...' : 'Spara kvitto'}
        </button>
      </div>
    </div>
  )
}
