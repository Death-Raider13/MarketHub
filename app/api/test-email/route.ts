import { NextRequest, NextResponse } from 'next/server'
import { sendOrderConfirmationEmail, sendServiceBookingConfirmationEmail } from '@/lib/email/service'
import { generateDownloadLinks } from '@/lib/digital-products/download-links'
import { devOnlyGuard } from '@/lib/api-auth'

export async function POST(request: NextRequest) {
  const blocked = devOnlyGuard()
  if (blocked) return blocked

  try {
    const { type, email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (type === 'order-confirmation') {
      // Test order confirmation email with digital products
      const mockOrder = {
        id: 'test-order-123',
        userEmail: email,
        customerName: 'Test Customer',
        total: 15000,
        subtotal: 13500,
        tax: 1500,
        shipping: 0,
        createdAt: new Date(),
        items: [
          {
            productName: 'Digital Marketing Course',
            productPrice: 10000,
            quantity: 1,
            product: {
              productType: 'digital',
              digitalFiles: [
                {
                  id: 'file1',
                  fileName: 'Marketing-Course-Module-1.pdf',
                  fileUrl: 'https://example.com/download/file1'
                },
                {
                  id: 'file2',
                  fileName: 'Marketing-Course-Module-2.pdf',
                  fileUrl: 'https://example.com/download/file2'
                }
              ]
            }
          },
          {
            productName: 'Business Consultation',
            productPrice: 5000,
            quantity: 1,
            product: {
              productType: 'service'
            }
          }
        ]
      }

      // Generate download links for digital products
      const digitalFiles = mockOrder.items
        .filter(item => item.product?.productType === 'digital')
        .flatMap(item => item.product?.digitalFiles || [])
        .filter(file => file && file.id && file.fileName && file.fileUrl)
        .map((file: any) => ({
          id: file.id,
          fileName: file.fileName,
          fileUrl: file.fileUrl,
          fileSize: file.fileSize || 1024,
          fileType: file.fileType || 'pdf',
          uploadedAt: file.uploadedAt || new Date()
        }))

      let downloadLinks: any[] | undefined = undefined
      if (digitalFiles.length > 0) {
        // For testing, we'll use a mock purchase ID
        downloadLinks = await generateDownloadLinks(digitalFiles, 24, 'test-purchase-123')
      }

      await sendOrderConfirmationEmail(mockOrder, downloadLinks)

      return NextResponse.json({
        success: true,
        message: 'Order confirmation email sent successfully',
        downloadLinksGenerated: downloadLinks?.length || 0
      })

    } else if (type === 'service-booking') {
      // Test service booking confirmation email
      await sendServiceBookingConfirmationEmail(
        email,
        'Test Customer',
        {
          id: 'booking-123',
          orderId: 'order-456',
          serviceName: 'Business Consultation',
          serviceDescription: 'One-on-one business strategy consultation session',
          creatorId: 'creator-789'
        },
        5000
      )

      return NextResponse.json({
        success: true,
        message: 'Service booking confirmation email sent successfully'
      })

    } else {
      return NextResponse.json({ error: 'Invalid email type' }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Test email error:', error)
    return NextResponse.json({
      error: error.message || 'Failed to send test email'
    }, { status: 500 })
  }
}