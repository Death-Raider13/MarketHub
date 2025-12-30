import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { createAdminRoleNotification } from '@/lib/notifications/admin-service'
import { 
  sendAbuseReportSubmittedEmail, 
  sendAbuseReportNotificationEmail, 
  sendAbuseReportAdminEmail 
} from '@/lib/email/service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const type = searchParams.get('type') || 'all'
    const priority = searchParams.get('priority') || 'all'

    let query = adminDb.collection('abuse_reports').orderBy('createdAt', 'desc')

    // Apply filters
    if (status && status !== 'all') {
      query = query.where('status', '==', status)
    }
    if (type && type !== 'all') {
      query = query.where('type', '==', type)
    }
    if (priority && priority !== 'all') {
      query = query.where('priority', '==', priority)
    }

    const snapshot = await query.limit(100).get()
    
    const reports = snapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
      }
    })

    return NextResponse.json({
      success: true,
      reports
    })

  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports', details: error },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      type,
      reportedItemId,
      reportedItemTitle,
      reportedItemUrl,
      reportedBy,
      category,
      reason,
      description,
      evidence
    } = await request.json()

    // Validate required fields
    if (!type || !reportedItemId || !reportedItemTitle || !reportedBy || !category || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Determine priority based on category
    let priority = 'medium'
    const highPriorityCategories = ['counterfeit', 'fraud', 'harassment', 'illegal_content']
    const criticalCategories = ['child_safety', 'terrorism', 'violence']
    
    if (criticalCategories.includes(category.toLowerCase())) {
      priority = 'critical'
    } else if (highPriorityCategories.includes(category.toLowerCase())) {
      priority = 'high'
    } else if (['spam', 'fake_reviews'].includes(category.toLowerCase())) {
      priority = 'low'
    }

    // Create the report
    const reportData = {
      type,
      reportedItem: {
        id: reportedItemId,
        title: reportedItemTitle,
        url: reportedItemUrl || null
      },
      reportedBy: {
        id: reportedBy.id,
        name: reportedBy.name,
        email: reportedBy.email
      },
      category,
      reason,
      description: description || '',
      evidence: evidence || [],
      status: 'pending',
      priority,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const reportRef = await adminDb.collection('abuse_reports').add(reportData)

    // Send email to reporter confirming submission
    try {
      await sendAbuseReportSubmittedEmail(reportedBy.email, {
        reporterName: reportedBy.name,
        reportType: type,
        reportedItemTitle: reportedItemTitle,
        reportId: reportRef.id,
        category: category,
        reason: reason
      })
    } catch (emailError) {
      console.error('Failed to send reporter confirmation email:', emailError)
    }

    // Get admin emails for notifications
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || []
    const supportEmail = process.env.SUPPORT_EMAIL || 'support@feromarkethub.com'
    const allAdminEmails = [...adminEmails, supportEmail].filter(Boolean)

    // Send email to admins
    try {
      if (allAdminEmails.length > 0) {
        await sendAbuseReportAdminEmail(allAdminEmails, {
          reporterName: reportedBy.name,
          reporterEmail: reportedBy.email,
          reportType: type,
          reportedItemTitle: reportedItemTitle,
          reportId: reportRef.id,
          category: category,
          reason: reason,
          priority: priority,
          description: description
        })
      }
    } catch (emailError) {
      console.error('Failed to send admin notification email:', emailError)
    }

    // Try to get the reported user's email and send notification
    try {
      let reportedUserEmail = null
      let reportedUserName = 'User'

      if (type === 'vendor' || type === 'user') {
        // For vendor/user reports, the reportedItemId is the user ID
        const userDoc = await adminDb.collection('users').doc(reportedItemId).get()
        if (userDoc.exists) {
          const userData = userDoc.data()
          reportedUserEmail = userData?.email
          reportedUserName = userData?.displayName || userData?.name || 'User'
        }
      } else if (type === 'product') {
        // For product reports, get the vendor from the product
        const productDoc = await adminDb.collection('products').doc(reportedItemId).get()
        if (productDoc.exists) {
          const productData = productDoc.data()
          if (productData?.vendorId) {
            const vendorDoc = await adminDb.collection('users').doc(productData.vendorId).get()
            if (vendorDoc.exists) {
              const vendorData = vendorDoc.data()
              reportedUserEmail = vendorData?.email
              reportedUserName = vendorData?.displayName || vendorData?.storeName || 'Vendor'
            }
          }
        }
      } else if (type === 'review') {
        // For review reports, get the review author
        const reviewDoc = await adminDb.collection('reviews').doc(reportedItemId).get()
        if (reviewDoc.exists) {
          const reviewData = reviewDoc.data()
          if (reviewData?.userId) {
            const userDoc = await adminDb.collection('users').doc(reviewData.userId).get()
            if (userDoc.exists) {
              const userData = userDoc.data()
              reportedUserEmail = userData?.email
              reportedUserName = userData?.displayName || userData?.name || 'User'
            }
          }
        }
      }

      // Send notification email to reported user (if we found their email)
      if (reportedUserEmail && reportedUserEmail !== reportedBy.email) {
        await sendAbuseReportNotificationEmail(reportedUserEmail, {
          reportedUserName: reportedUserName,
          reportType: type,
          reportedItemTitle: reportedItemTitle,
          reportId: reportRef.id,
          category: category
        })
      }
    } catch (emailError) {
      console.error('Failed to send reported user notification email:', emailError)
      // Don't fail the report creation if this email fails
    }

    // Notify admins about new report
    try {
      await createAdminRoleNotification(['admin', 'super_admin', 'moderator'], 'abuse_report_created', {
        metadata: {
          reportType: type,
          reportedItem: reportedItemTitle,
          reportedBy: reportedBy.name,
          category: category,
          priority: priority,
          actionUrl: '/admin/reports-abuse'
        } as any
      })
    } catch (notificationError) {
      console.error('Failed to send report notifications:', notificationError)
      // Don't fail the report creation if notifications fail
    }

    return NextResponse.json({
      success: true,
      reportId: reportRef.id,
      message: 'Report submitted successfully'
    })

  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    )
  }
}