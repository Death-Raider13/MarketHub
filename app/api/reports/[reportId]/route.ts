import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { createAdminNotification } from '@/lib/notifications/admin-service'
import { sendAbuseReportStatusUpdateEmail } from '@/lib/email/service'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const reportId = params.reportId
    const { status, resolution, assignedTo } = await request.json()

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      )
    }

    // Get the current report
    const reportDoc = await adminDb.collection('abuse_reports').doc(reportId).get()
    
    if (!reportDoc.exists) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    const reportData = reportDoc.data()

    // Update the report
    const updateData: any = {
      updatedAt: new Date()
    }

    if (status) updateData.status = status
    if (resolution) updateData.resolution = resolution
    if (assignedTo) updateData.assignedTo = assignedTo

    await adminDb.collection('abuse_reports').doc(reportId).update(updateData)

    // Send email notification to reporter about status change
    if (status && reportData?.reportedBy?.email) {
      try {
        await sendAbuseReportStatusUpdateEmail(reportData.reportedBy.email, {
          reporterName: reportData.reportedBy.name || 'User',
          reportType: reportData.type || 'content',
          reportedItemTitle: reportData.reportedItem?.title || 'Reported Item',
          reportId: reportId,
          status: status,
          resolution: resolution
        })
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError)
        // Don't fail the update if email fails
      }
    }

    // Notify the reporter about status changes
    if (status && reportData?.reportedBy?.id) {
      try {
        let notificationType = 'abuse_report_updated'
        if (status === 'resolved') notificationType = 'abuse_report_resolved'
        else if (status === 'dismissed') notificationType = 'abuse_report_dismissed'

        await createAdminNotification(reportData.reportedBy.id, notificationType as any, {
          metadata: {
            reportId: reportId,
            reportType: reportData.type,
            reportedItem: reportData.reportedItem?.title,
            status: status,
            resolution: resolution || '',
            actionUrl: '/account/reports'
          } as any
        })
      } catch (notificationError) {
        console.error('Failed to send status update notification:', notificationError)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Report updated successfully'
    })

  } catch (error) {
    console.error('Error updating report:', error)
    return NextResponse.json(
      { error: 'Failed to update report' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const reportId = params.reportId

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID is required' },
        { status: 400 }
      )
    }

    await adminDb.collection('abuse_reports').doc(reportId).delete()

    return NextResponse.json({
      success: true,
      message: 'Report deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting report:', error)
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    )
  }
}