import { useNavigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import type { Receipt, Area } from '../types'
import { formatDate, formatAmount } from '../utils/imageUtils'

interface Props {
  receipt: Receipt
  area?: Area
}

export default function ReceiptCard({ receipt, area }: Props) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(`/kvitton/${receipt.id}`)}
      className="w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex items-center gap-3 p-3 text-left hover:shadow-md transition-shadow active:scale-[0.99]"
    >
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
        {receipt.imageData ? (
          <img
            src={receipt.imageData}
            alt="Kvitto"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="w-6 h-6 text-gray-400" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {area && (
          <span
            className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white mb-1"
            style={{ backgroundColor: area.color }}
          >
            {area.name}
          </span>
        )}
        <p className="text-sm text-gray-700 truncate">
          {receipt.notes || 'Ingen notering'}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{formatDate(receipt.date)}</p>
      </div>

      {/* Amount */}
      {receipt.amount !== undefined && receipt.amount > 0 && (
        <div className="text-right flex-shrink-0">
          <span className="text-sm font-semibold text-gray-800">
            {formatAmount(receipt.amount, receipt.currency)}
          </span>
        </div>
      )}
    </button>
  )
}
