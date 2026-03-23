export type AreaType = 'anställning' | 'företag' | 'förening' | 'verksamhet' | 'övrigt'

export interface Area {
  id: string
  name: string
  type: AreaType
  color: string
  createdAt: Date
}

export interface Receipt {
  id: string
  imageData: string
  notes: string
  areaId: string
  amount?: number
  currency: string
  date: Date
  createdAt: Date
}

export const AREA_TYPE_LABELS: Record<AreaType, string> = {
  anställning: 'Anställning',
  företag: 'Företag',
  förening: 'Förening',
  verksamhet: 'Verksamhet',
  övrigt: 'Övrigt',
}

export const AREA_COLORS = [
  '#2563eb', // blå
  '#16a34a', // grön
  '#dc2626', // röd
  '#9333ea', // lila
  '#ea580c', // orange
  '#0891b2', // cyan
  '#be185d', // rosa
  '#78350f', // brun
  '#0f766e', // teal
  '#4f46e5', // indigo
]
