import jsPDF from 'jspdf'
import type { Receipt, Area } from '../types'
import { AREA_TYPE_LABELS } from '../types'
import { formatDate, formatAmount } from './imageUtils'

const PAGE_W = 210
const PAGE_H = 297
const MARGIN = 14
const CONTENT_W = PAGE_W - MARGIN * 2
const HEADER_H = 22

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ]
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export async function exportReceiptsToPDF(
  receipts: Receipt[],
  areaMap: Map<string, Area>,
): Promise<void> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const today = formatDate(new Date())

  for (let i = 0; i < receipts.length; i++) {
    if (i > 0) pdf.addPage()

    const receipt = receipts[i]
    const area = areaMap.get(receipt.areaId)

    // --- Header bar ---
    pdf.setFillColor(37, 99, 235)
    pdf.rect(0, 0, PAGE_W, HEADER_H, 'F')

    pdf.setTextColor(255, 255, 255)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(13)
    pdf.text('Kvitto-logg', MARGIN, 14)

    // Area badge in header
    if (area) {
      const [r, g, b] = hexToRgb(area.color)
      const badgeText = area.name
      pdf.setFontSize(8)
      const textW = pdf.getTextWidth(badgeText)
      const badgeW = textW + 6
      const badgeX = PAGE_W - MARGIN - badgeW
      pdf.setFillColor(255, 255, 255, 0.25)
      // Semi-transparent overlay effect with white
      pdf.setFillColor(Math.min(r + 60, 255), Math.min(g + 60, 255), Math.min(b + 60, 255))
      pdf.roundedRect(badgeX, 8, badgeW, 8, 2, 2, 'F')
      pdf.setTextColor(255, 255, 255)
      pdf.setFont('helvetica', 'normal')
      pdf.text(badgeText, badgeX + 3, 13.5)
    }

    // Page number
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`${i + 1} / ${receipts.length}`, PAGE_W - MARGIN, 14, { align: 'right' })

    // --- Receipt image ---
    let cursorY = HEADER_H + 6
    const maxImgH = 155
    const maxImgW = CONTENT_W

    try {
      const img = await loadImage(receipt.imageData)
      const scaleW = maxImgW / img.naturalWidth
      const scaleH = maxImgH / img.naturalHeight
      const scale = Math.min(scaleW, scaleH)
      const pdfW = img.naturalWidth * scale
      const pdfH = img.naturalHeight * scale
      const imgX = MARGIN + (maxImgW - pdfW) / 2

      // Subtle shadow/border behind image
      pdf.setFillColor(243, 244, 246)
      pdf.roundedRect(imgX - 2, cursorY - 2, pdfW + 4, pdfH + 4, 2, 2, 'F')
      pdf.addImage(receipt.imageData, 'JPEG', imgX, cursorY, pdfW, pdfH)
      cursorY += pdfH + 8
    } catch {
      pdf.setTextColor(156, 163, 175)
      pdf.setFontSize(9)
      pdf.text('[Bild kunde inte laddas]', PAGE_W / 2, cursorY + 10, { align: 'center' })
      cursorY += 20
    }

    // --- Separator ---
    pdf.setDrawColor(229, 231, 235)
    pdf.setLineWidth(0.4)
    pdf.line(MARGIN, cursorY, PAGE_W - MARGIN, cursorY)
    cursorY += 6

    // --- Details ---
    const labelX = MARGIN
    const valueX = MARGIN + 32
    const valueW = PAGE_W - MARGIN - valueX

    const rows: { label: string; value: string }[] = [
      { label: 'Datum', value: formatDate(receipt.date) },
      {
        label: 'Belopp',
        value:
          receipt.amount !== undefined && receipt.amount > 0
            ? formatAmount(receipt.amount, receipt.currency)
            : '—',
      },
      {
        label: 'Område',
        value: area
          ? `${area.name}  (${AREA_TYPE_LABELS[area.type]})`
          : '—',
      },
      { label: 'Notering', value: receipt.notes || '—' },
    ]

    pdf.setFontSize(8.5)

    for (const row of rows) {
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(107, 114, 128)
      pdf.text(row.label, labelX, cursorY)

      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(17, 24, 39)
      const lines = pdf.splitTextToSize(row.value, valueW) as string[]
      pdf.text(lines, valueX, cursorY)
      cursorY += 5.5 * lines.length + 1
    }

    // --- Footer ---
    pdf.setDrawColor(229, 231, 235)
    pdf.setLineWidth(0.3)
    pdf.line(MARGIN, PAGE_H - 12, PAGE_W - MARGIN, PAGE_H - 12)

    pdf.setTextColor(156, 163, 175)
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`Exporterat ${today} via Kvitto-logg`, PAGE_W / 2, PAGE_H - 7, {
      align: 'center',
    })
  }

  const filename = `kvitton-${new Date().toISOString().split('T')[0]}.pdf`
  pdf.save(filename)
}
