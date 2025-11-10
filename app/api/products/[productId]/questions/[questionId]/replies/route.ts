import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin'

// GET - Get all replies for a question
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string, questionId: string } }
) {
  try {
    const { questionId } = params

    const adminDb = getAdminFirestore()
    
    if (!adminDb) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    const repliesSnapshot = await adminDb
      .collection('questionReplies')
      .where('questionId', '==', questionId)
      .get()

    const replies = repliesSnapshot.docs
      .map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      }))
      .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    return NextResponse.json({
      success: true,
      replies
    })
  } catch (error) {
    console.error('Error fetching replies:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch replies',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - Add a reply to a question
export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string, questionId: string } }
) {
  try {
    const { questionId } = params
    const { userId, userName, message, isVendor } = await request.json()

    if (!userId || !userName || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    const replyData = {
      questionId,
      userId,
      userName,
      message: message.trim(),
      isVendor: isVendor || false,
      createdAt: new Date()
    }

    const replyRef = await adminDb.collection('questionReplies').add(replyData)

    return NextResponse.json({
      success: true,
      replyId: replyRef.id,
      message: 'Reply added successfully'
    })
  } catch (error) {
    console.error('Error adding reply:', error)
    return NextResponse.json(
      { 
        error: 'Failed to add reply',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
