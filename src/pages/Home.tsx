import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { PlusCircle, Receipt as ReceiptIcon, FolderOpen, TrendingUp } from 'lucide-react'
import { db } from '../db/database'
import { formatAmount } from '../utils/imageUtils'
import ReceiptCard from '../components/ReceiptCard'

export default function Home() {
  const navigate = useNavigate()

  const recentReceipts = useLiveQuery(() =>
    db.receipts.orderBy('createdAt').reverse().limit(5).toArray(),
  )
  const areas = useLiveQuery(() => db.areas.toArray())
  const totalCount = useLiveQuery(() => db.receipts.count())
  const totalAmount = useLiveQuery(async () => {
    const all = await db.receipts.toArray()
    return all.reduce((sum, r) => sum + (r.amount ?? 0), 0)
  })

  const areaMap = new Map(areas?.map((a) => [a.id, a]))

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 pt-12 pb-10">
        <h1 className="text-2xl font-bold">Kvitto-logg</h1>
        <p className="text-blue-200 text-sm mt-1">Dina kvitton, organiserade</p>
      </div>

      <div className="px-4 -mt-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <ReceiptIcon className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <div className="text-xl font-bold text-gray-800">{totalCount ?? 0}</div>
            <div className="text-xs text-gray-500">Kvitton</div>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <FolderOpen className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <div className="text-xl font-bold text-gray-800">{areas?.length ?? 0}</div>
            <div className="text-xs text-gray-500">Områden</div>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <TrendingUp className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <div className="text-sm font-bold text-gray-800">
              {totalAmount ? formatAmount(totalAmount, 'SEK') : '—'}
            </div>
            <div className="text-xs text-gray-500">Totalt</div>
          </div>
        </div>

        {/* Quick add */}
        <button
          onClick={() => navigate('/lagg-till')}
          className="w-full bg-blue-600 text-white rounded-xl py-3 flex items-center justify-center gap-2 font-medium shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-colors"
        >
          <PlusCircle className="w-5 h-5" />
          Lägg till kvitto
        </button>

        {/* Recent receipts */}
        {recentReceipts && recentReceipts.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-800">Senaste kvitton</h2>
              <button
                onClick={() => navigate('/kvitton')}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Visa alla
              </button>
            </div>
            <div className="space-y-2">
              {recentReceipts.map((receipt) => (
                <ReceiptCard
                  key={receipt.id}
                  receipt={receipt}
                  area={areaMap.get(receipt.areaId)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-14 text-gray-400">
            <ReceiptIcon className="w-16 h-16 mx-auto mb-3 opacity-25" />
            <p className="text-lg font-medium text-gray-500">Inga kvitton ännu</p>
            <p className="text-sm mt-1">Börja med att lägga till ditt första kvitto</p>
          </div>
        )}
      </div>
    </div>
  )
}
