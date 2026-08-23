import assert from 'node:assert/strict'
import JSZip from 'jszip'
import { PDFDocument } from 'pdf-lib'
import { watermarkFile } from '../lib/watermark'

const context = {
  userId: 'buyer-test-001',
  orderId: 'order-test-001',
  productId: 'product-test-001',
  fileId: 'file-test-001',
}

async function main() {
  process.env.MARKETHUB_WATERMARK_SECRET = 'local-test-secret-only'

  const sourcePdf = await PDFDocument.create()
  const page = sourcePdf.addPage([300, 300])
  page.drawText('Fero E-Library watermark test')
  const source = await sourcePdf.save()
  const pdfResult = await watermarkFile(source, 'book.pdf', 'application/pdf', context)

  assert.equal(pdfResult.format, 'pdf')
  assert.notEqual(pdfResult.sourceHash, pdfResult.outputHash)
  assert.equal(pdfResult.watermarkId.length, 64)
  const reopened = await PDFDocument.load(pdfResult.bytes)
  assert.ok(reopened.getKeywords()?.includes(`FeroE-Library:FERO-WM-${pdfResult.watermarkId}`))
  assert.equal(reopened.getPageCount(), 1)

  const sourceZip = await new JSZip().file('content.txt', 'protected content').generateAsync({ type: 'uint8array' })
  const zipResult = await watermarkFile(sourceZip, 'book.zip', 'application/zip', context)
  assert.equal(zipResult.format, 'zip-container')
  assert.notEqual(zipResult.sourceHash, zipResult.outputHash)
  const outputZip = await JSZip.loadAsync(zipResult.bytes)
  const manifest = JSON.parse(await outputZip.file('__FERO_WATERMARK__/manifest.json')!.async('string'))
  assert.equal(manifest.watermarkId, zipResult.watermarkId)
  assert.equal(manifest.orderId, context.orderId)

  const epubSource = await new JSZip().file('mimetype', 'application/epub+zip').file('OEBPS/content.xhtml', '<html/>').generateAsync({ type: 'uint8array' })
  const epubResult = await watermarkFile(epubSource, 'book.epub', 'application/epub+zip', context)
  assert.equal(epubResult.format, 'zip-container')
  const epubOutput = await JSZip.loadAsync(epubResult.bytes)
  assert.ok(epubOutput.file('__FERO_WATERMARK__/manifest.json'))

  const mp3Source = Buffer.concat([Buffer.from('ID3\x04\x00\x00\x00\x00\x00\x00', 'binary'), Buffer.from('fake-audio')])
  const mp3Result = await watermarkFile(mp3Source, 'lesson.mp3', 'audio/mpeg', context)
  assert.equal(mp3Result.format, 'mp3-id3')
  assert.notEqual(mp3Result.sourceHash, mp3Result.outputHash)
  assert.ok(Buffer.from(mp3Result.bytes).includes(Buffer.from(`FERO-WM-${mp3Result.watermarkId}`, 'ascii')))

  const mp4Source = Buffer.from('fake-mp4-content')
  const mp4Result = await watermarkFile(mp4Source, 'lesson.mp4', 'video/mp4', context)
  assert.equal(mp4Result.format, 'mp4-uuid')
  assert.notEqual(mp4Result.sourceHash, mp4Result.outputHash)
  assert.ok(Buffer.from(mp4Result.bytes).includes(Buffer.from(`FERO-WM-${mp4Result.watermarkId}`, 'utf8')))

  const txtSource = Buffer.from('plain lesson text', 'utf8')
  const txtResult = await watermarkFile(txtSource, 'notes.txt', 'text/plain', context)
  assert.equal(txtResult.format, 'txt-zero-width')
  assert.notEqual(txtResult.sourceHash, txtResult.outputHash)
  assert.ok(Buffer.from(txtResult.bytes).includes(Buffer.from([0xe2, 0x81, 0xa3])))

  const legacyResult = await watermarkFile(Buffer.from('legacy-binary-content'), 'legacy.doc', 'application/msword', context)
  assert.equal(legacyResult.format, 'opaque-trailer')
  assert.notEqual(legacyResult.sourceHash, legacyResult.outputHash)
  assert.ok(Buffer.from(legacyResult.bytes).includes(Buffer.from(`FERO-WM-${legacyResult.watermarkId}`, 'utf8')))

  console.log(JSON.stringify({
    passed: true,
    supportedFormats: [pdfResult.format, zipResult.format, mp3Result.format, mp4Result.format, txtResult.format, legacyResult.format],
    pdfPageCount: reopened.getPageCount(),
    watermarkId: pdfResult.watermarkId,
  }))
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
