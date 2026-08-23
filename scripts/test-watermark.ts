import assert from 'node:assert/strict'
import { PDFDocument } from 'pdf-lib'
import { watermarkPdf } from '../lib/watermark'

async function main() {
  process.env.MARKETHUB_WATERMARK_SECRET = 'local-test-secret-only'

  const sourcePdf = await PDFDocument.create()
  const page = sourcePdf.addPage([300, 300])
  page.drawText('Fero E-Library watermark test')
  const source = await sourcePdf.save()
  const result = await watermarkPdf(source, {
    userId: 'buyer-test-001',
    orderId: 'order-test-001',
    productId: 'product-test-001',
    fileId: 'file-test-001',
  })

  assert.equal(result.format, 'pdf')
  assert.notEqual(result.sourceHash, result.outputHash)
  assert.ok(result.watermarkId.length === 64)
  const reopened = await PDFDocument.load(result.bytes)
  assert.ok(reopened.getKeywords()?.includes(`FeroE-Library:FERO-WM-${result.watermarkId}`))
  assert.equal(reopened.getPageCount(), 1)
  console.log(JSON.stringify({
    passed: true,
    pageCount: reopened.getPageCount(),
    watermarkId: result.watermarkId,
    sourceHash: result.sourceHash,
    outputHash: result.outputHash,
  }))
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
