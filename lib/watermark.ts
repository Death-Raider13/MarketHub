import crypto from 'node:crypto'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export interface WatermarkContext {
  userId: string
  orderId: string
  productId: string
  fileId: string
}

export interface WatermarkedFile {
  bytes: Uint8Array
  watermarkId: string
  sourceHash: string
  outputHash: string
  format: 'pdf'
}

function secretKey() {
  const secret = process.env.MARKETHUB_WATERMARK_SECRET || process.env.FIREBASE_ADMIN_PRIVATE_KEY
  if (!secret) throw new Error('MARKETHUB_WATERMARK_SECRET is not configured')
  return secret
}

function stableWatermarkId(context: WatermarkContext) {
  return crypto.createHmac('sha256', secretKey())
    .update([context.userId, context.orderId, context.productId, context.fileId].join('|'))
    .digest('hex')
}

export async function watermarkPdf(source: Uint8Array, context: WatermarkContext): Promise<WatermarkedFile> {
  const sourceHash = crypto.createHash('sha256').update(source).digest('hex')
  const watermarkId = stableWatermarkId(context)
  const marker = `FERO-WM-${watermarkId}`
  const pdf = await PDFDocument.load(source, { updateMetadata: false })
  const font = await pdf.embedFont(StandardFonts.Helvetica)

  pdf.setKeywords([`FeroE-Library:${marker}`, `Order:${context.orderId}`, `Product:${context.productId}`])
  pdf.setProducer('Fero E-Library Digital Rights Protection')
  pdf.setSubject('Protected digital publication')

  // A zero-opacity text object is retained in the PDF content stream but is
  // not visible in normal viewers. Metadata provides a second embedded signal.
  for (const page of pdf.getPages()) {
    page.drawText(marker, {
      x: 0,
      y: 0,
      size: 0.1,
      font,
      color: rgb(0, 0, 0),
      opacity: 0,
    })
  }

  const bytes = await pdf.save({ useObjectStreams: true, addDefaultPage: false })
  const outputHash = crypto.createHash('sha256').update(bytes).digest('hex')
  return { bytes, watermarkId, sourceHash, outputHash, format: 'pdf' }
}

export function isPdf(fileName: string, contentType?: string) {
  return contentType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')
}
