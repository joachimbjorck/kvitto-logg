import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  PlusCircle,
  Receipt as ReceiptIcon,
  FolderOpen,
  TrendingUp,
  ShieldAlert,
  HardDriveDownload,
} from 'lucide-react'
import { db } from '../db/database'
import { formatAmount } from '../utils/imageUtils'
import { daysSinceLastBackup, getLastBackupDate } from '../utils/backupUtils'
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

  const days = daysSinceLastBackup()
  const neverBacked = getLastBackupDate() === null
  const showBackupWarning = neverBacked || (days !== null && days >= 7)

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 pt-12 pb-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Kvitto-logg</h1>
            <p className="text-blue-200 text-sm mt-1">Dina kvitton, organiserade</p>
          </div>
          <button
            onClick={() => navigate('/backup')}
            className="p-2 rounded-xl bg-blue-500 hover:bg-blue-400 transition-colors"
            title="Säkerhetskopiering"
          >
            <HardDriveDownload className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="px-4 -mt-5 space-y-4">
        {/* Backup warning */}
        {showBackupWarning && (
          <button
            onClick={() => navigate('/backup')}
            className="w-full flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-left hover:bg-orange-100 transition-colors"
          >
            <ShieldAlert className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-orange-800">
                {neverBacked
                  ? 'Du har aldrig säkerhetskopierat'
                  : `Senaste backup för ${days} dagar sedan`}
              </p>
              <p className="text-xs text-orange-600 mt-0.5">
                Tryck för att göra en backup nu
              </p>
            </div>
          </button>
        )}

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
