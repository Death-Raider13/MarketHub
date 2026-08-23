import crypto from 'node:crypto'
import JSZip from 'jszip'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export interface WatermarkContext {
  userId: string
  orderId: string
  productId: string
  fileId: string
}

export type WatermarkFormat = 'pdf' | 'zip-container' | 'mp3-id3' | 'mp4-uuid' | 'txt-zero-width' | 'opaque-trailer'

export interface WatermarkedFile {
  bytes: Uint8Array
  watermarkId: string
  sourceHash: string
  outputHash: string
  format: WatermarkFormat
}

function secretKey() {
  const secret = process.env.MARKETHUB_WATERMARK_SECRET
  if (!secret) throw new Error('MARKETHUB_WATERMARK_SECRET is not configured')
  return secret
}

function stableWatermarkId(context: WatermarkContext) {
  return crypto.createHmac('sha256', secretKey())
    .update([context.userId, context.orderId, context.productId, context.fileId].join('|'))
    .digest('hex')
}

function hashes(source: Uint8Array, output: Uint8Array, watermarkId: string, format: WatermarkFormat): WatermarkedFile {
  return {
    bytes: output,
    watermarkId,
    sourceHash: crypto.createHash('sha256').update(source).digest('hex'),
    outputHash: crypto.createHash('sha256').update(output).digest('hex'),
    format,
  }
}

export async function watermarkPdf(source: Uint8Array, context: WatermarkContext): Promise<WatermarkedFile> {
  const watermarkId = stableWatermarkId(context)
  const marker = `FERO-WM-${watermarkId}`
  const pdf = await PDFDocument.load(source, { updateMetadata: false })
  const font = await pdf.embedFont(StandardFonts.Helvetica)

  pdf.setKeywords([`FeroE-Library:${marker}`, `Order:${context.orderId}`, `Product:${context.productId}`])
  pdf.setProducer('Fero E-Library Digital Rights Protection')
  pdf.setSubject('Protected digital publication')

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
  return hashes(source, bytes, watermarkId, 'pdf')
}

const ZIP_CONTAINER_EXTENSIONS = new Set(['.zip', '.epub', '.docx', '.xlsx', '.pptx'])
const AUDIO_EXTENSIONS = new Set(['.mp3'])
const VIDEO_EXTENSIONS = new Set(['.mp4'])
const TEXT_EXTENSIONS = new Set(['.txt'])
const LEGACY_BINARY_EXTENSIONS = new Set(['.doc', '.xls', '.ppt', '.mobi'])

function extension(fileName: string) {
  const lower = fileName.toLowerCase()
  const index = lower.lastIndexOf('.')
  return index >= 0 ? lower.slice(index) : ''
}

export function isPdf(fileName: string, contentType?: string) {
  return contentType?.split(';')[0].trim() === 'application/pdf' || extension(fileName) === '.pdf'
}

export function isZipContainer(fileName: string, contentType?: string) {
  const normalizedType = contentType?.split(';')[0].trim().toLowerCase()
  return ZIP_CONTAINER_EXTENSIONS.has(extension(fileName)) || normalizedType === 'application/zip' || normalizedType === 'application/epub+zip'
}

export function isMp3(fileName: string, contentType?: string) {
  const normalizedType = contentType?.split(';')[0].trim().toLowerCase()
  return AUDIO_EXTENSIONS.has(extension(fileName)) || normalizedType === 'audio/mpeg' || normalizedType === 'audio/mp3'
}

export function isMp4(fileName: string, contentType?: string) {
  const normalizedType = contentType?.split(';')[0].trim().toLowerCase()
  return VIDEO_EXTENSIONS.has(extension(fileName)) || normalizedType === 'video/mp4'
}

export function isText(fileName: string, contentType?: string) {
  const normalizedType = contentType?.split(';')[0].trim().toLowerCase()
  return TEXT_EXTENSIONS.has(extension(fileName)) || normalizedType === 'text/plain'
}

export function isLegacyBinary(fileName: string, contentType?: string) {
  const normalizedType = contentType?.split(';')[0].trim().toLowerCase()
  return LEGACY_BINARY_EXTENSIONS.has(extension(fileName)) || normalizedType === 'application/msword' || normalizedType === 'application/vnd.ms-excel' || normalizedType === 'application/vnd.ms-powerpoint' || normalizedType === 'application/x-mobipocket-ebook'
}

export function isWatermarkSupported(fileName: string, contentType?: string) {
  return isPdf(fileName, contentType) || isZipContainer(fileName, contentType) || isMp3(fileName, contentType) || isMp4(fileName, contentType) || isText(fileName, contentType) || isLegacyBinary(fileName, contentType)
}

/**
 * Adds a purchaser-specific manifest inside ZIP-based formats. This covers ZIP,
 * EPUB and Office Open XML containers without changing their visible content.
 */
export async function watermarkZipContainer(source: Uint8Array, context: WatermarkContext): Promise<WatermarkedFile> {
  const watermarkId = stableWatermarkId(context)
  const zip = await JSZip.loadAsync(source)
  const marker = `FERO-WM-${watermarkId}`
  const manifest = JSON.stringify({
    watermarkId,
    marker,
    orderId: context.orderId,
    productId: context.productId,
    fileId: context.fileId,
    issuedTo: context.userId,
    version: 1,
    purpose: 'Fero E-Library protected digital delivery',
  }, null, 2)

  zip.file('__FERO_WATERMARK__/manifest.json', manifest, { createFolders: true })
  zip.file('__FERO_WATERMARK__/README.txt', 'This file contains an embedded Fero E-Library rights marker. Do not remove or redistribute the protected work.\n')
  const bytes = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' })
  return hashes(source, bytes, watermarkId, 'zip-container')
}

function syncSafeNumber(value: number) {
  return Buffer.from([
    (value >>> 21) & 0x7f,
    (value >>> 14) & 0x7f,
    (value >>> 7) & 0x7f,
    value & 0x7f,
  ])
}

function syncSafeValue(bytes: Uint8Array) {
  return ((bytes[0] & 0x7f) << 21) | ((bytes[1] & 0x7f) << 14) | ((bytes[2] & 0x7f) << 7) | (bytes[3] & 0x7f)
}

/**
 * Embeds an ID3v2 TXXX frame. It does not alter encoded audio samples, so the
 * returned MP3 remains playable while the purchaser marker is available to an
 * investigator reading its metadata.
 */
export function watermarkMp3(source: Uint8Array, context: WatermarkContext): WatermarkedFile {
  const watermarkId = stableWatermarkId(context)
  const marker = `FERO-WM-${watermarkId}`
  const framePayload = Buffer.concat([
    Buffer.from([0]),
    Buffer.from(`FeroE-Library\0${marker}`, 'ascii'),
  ])
  const frame = Buffer.concat([
    Buffer.from('TXXX', 'ascii'),
    Buffer.alloc(4),
    Buffer.from([0, 0]),
    framePayload,
  ])
  frame.writeUInt32BE(framePayload.length, 4)

  let output: Buffer
  if (source.length >= 10 && Buffer.from(source.subarray(0, 3)).toString('ascii') === 'ID3') {
    const bodyLength = syncSafeValue(source.subarray(6, 10))
    const footerLength = (source[5] & 0x10) === 0x10 ? 10 : 0
    const tagEnd = 10 + bodyLength + footerLength
    if (tagEnd <= source.length) {
      const originalBody = source.subarray(10, 10 + bodyLength)
      const body = Buffer.concat([originalBody, frame])
      const header = Buffer.concat([
        Buffer.from('ID3', 'ascii'),
        Buffer.from([source[3], source[4], source[5] & 0xef]),
        syncSafeNumber(body.length),
      ])
      output = Buffer.concat([header, body, source.subarray(tagEnd)])
    } else {
      output = Buffer.concat([source, frame])
    }
  } else {
    const body = frame
    const header = Buffer.concat([Buffer.from('ID3\x04\x00\x00', 'binary'), syncSafeNumber(body.length)])
    output = Buffer.concat([header, body, source])
  }
  return hashes(source, output, watermarkId, 'mp3-id3')
}

/**
 * Adds a top-level ISO-BMFF UUID box to MP4. Players ignore unknown UUID boxes,
 * while forensic tooling can recover the marker without re-encoding video.
 */
export function watermarkMp4(source: Uint8Array, context: WatermarkContext): WatermarkedFile {
  const watermarkId = stableWatermarkId(context)
  const payload = Buffer.from(JSON.stringify({
    marker: `FERO-WM-${watermarkId}`,
    watermarkId,
    orderId: context.orderId,
    productId: context.productId,
    fileId: context.fileId,
    version: 1,
  }), 'utf8')
  const userType = Buffer.from('FEROE-LIBRARY-WM1', 'ascii')
  const boxSize = 8 + 16 + payload.length
  if (boxSize > 0xffffffff) throw new Error('MP4 watermark is too large')
  const box = Buffer.alloc(boxSize)
  box.writeUInt32BE(boxSize, 0)
  box.write('uuid', 4, 'ascii')
  userType.copy(box, 8)
  payload.copy(box, 24)
  return hashes(source, Buffer.concat([source, box]), watermarkId, 'mp4-uuid')
}

function zeroWidthEncode(value: string) {
  return Array.from(Buffer.from(value, 'utf8').toString('hex'))
    .map((hex) => parseInt(hex, 16).toString(2).padStart(4, '0'))
    .join('')
    .replace(/0/g, '\u200b')
    .replace(/1/g, '\u200c')
}

/** Embeds an invisible marker after the text using zero-width Unicode codepoints. */
export function watermarkText(source: Uint8Array, context: WatermarkContext): WatermarkedFile {
  const watermarkId = stableWatermarkId(context)
  const marker = `FERO-WM-${watermarkId}`
  const invisibleMarker = Buffer.from(`\n\u2063${zeroWidthEncode(marker)}\u2063`, 'utf8')
  return hashes(source, Buffer.concat([source, invisibleMarker]), watermarkId, 'txt-zero-width')
}

/**
 * Legacy OLE/MOBI formats have no safe pure-Node metadata editor. A binary
 * trailer is invisible to normal document readers and preserves the original
 * file bytes; it is still an evidence marker, not tamper-proof DRM.
 */
export function watermarkLegacyBinary(source: Uint8Array, context: WatermarkContext): WatermarkedFile {
  const watermarkId = stableWatermarkId(context)
  const payload = Buffer.from(JSON.stringify({
    magic: 'FERO-WATERMARK-TRAILER-V1',
    watermarkId,
    marker: `FERO-WM-${watermarkId}`,
    orderId: context.orderId,
    productId: context.productId,
    fileId: context.fileId,
    version: 1,
  }), 'utf8')
  const trailer = Buffer.concat([Buffer.from('\\nFERO-WM-TRAILER\\0', 'binary'), payload, Buffer.from('\\0FERO-WM-END', 'binary')])
  return hashes(source, Buffer.concat([source, trailer]), watermarkId, 'opaque-trailer')
}

export async function watermarkFile(source: Uint8Array, fileName: string, contentType: string | undefined, context: WatermarkContext) {
  if (isPdf(fileName, contentType)) return watermarkPdf(source, context)
  if (isZipContainer(fileName, contentType)) return watermarkZipContainer(source, context)
  if (isMp3(fileName, contentType)) return watermarkMp3(source, context)
  if (isMp4(fileName, contentType)) return watermarkMp4(source, context)
  if (isText(fileName, contentType)) return watermarkText(source, context)
  if (isLegacyBinary(fileName, contentType)) return watermarkLegacyBinary(source, context)
  throw new Error(`No verified watermark implementation for ${fileName}`)
}
