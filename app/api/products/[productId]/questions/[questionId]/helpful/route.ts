import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin'

// POST - Mark question as helpful
export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string, questionId: string } }
) {
  try {
    const { questionId } = params
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const adminDb = getAdminFirestore()
    
    if (!adminDb) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    // Check if user already marked this as helpful
    const helpfulSnapshot = await adminDb
      .collection('questionHelpful')
      .where('questionId', '==', questionId)
      .where('userId', '==', userId)
      .get()

    if (!helpfulSnapshot.empty) {
      return NextResponse.json(
        { error: 'You have already marked this as helpful' },
        { status: 400 }
      )
    }

    // Add helpful record
    await adminDb.collection('questionHelpful').add({
      questionId,
      userId,
      createdAt: new Date()
    })

    // Update question helpful count
    const questionRef = adminDb.collection('questions').doc(questionId)
    const questionDoc = await questionRef.get()
    
    if (!questionDoc.exists) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }

    const currentHelpful = questionDoc.data()?.helpful || 0
    const newHelpfulCount = currentHelpful + 1

    await questionRef.update({
      helpful: newHelpfulCount,
      updatedAt: new Date()
    })

    return NextResponse.json({
      success: true,
      helpfulCount: newHelpfulCount,
      message: 'Marked as helpful successfully'
    })
  } catch (error) {
    console.error('Error marking as helpful:', error)
    return NextResponse.json(
      { 
        error: 'Failed to mark as helpful',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
