import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin'
import { notificationService } from '@/lib/notifications/service'

// GET - Get all questions for a product
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params
    console.log('GET questions for productId:', productId)
    
    const adminDb = getAdminFirestore()
    
    if (!adminDb) {
      console.error('AdminDb not initialized')
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    console.log('Querying questions collection...')
    // Get all questions for the product
    const questionsSnapshot = await adminDb
      .collection('questions')
      .where('productId', '==', productId)
      .get()
    
    console.log('Found', questionsSnapshot.docs.length, 'questions')

    const questions = questionsSnapshot.docs
      .filter((doc: any) => doc.data().status === 'approved')
      .map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
      }))
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Load replies for each question
    for (const question of questions) {
      try {
        const repliesSnapshot = await adminDb
          .collection('questionReplies')
          .where('questionId', '==', question.id)
          .get()

        question.replies = repliesSnapshot.docs
          .map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
          }))
          .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      } catch (error) {
        console.error('Error loading replies for question', question.id, error)
        question.replies = []
      }
    }

    return NextResponse.json({
      success: true,
      questions
    })
  } catch (error) {
    console.error('Error fetching questions:', error)
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { 
        error: 'Failed to fetch questions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - Create a new question
export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params
    const { userId, userName, userEmail, question, vendorId, productName } = await request.json()

    if (!userId || !userName || !question || !vendorId) {
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

    // Get product name if not provided
    let finalProductName = productName
    if (!finalProductName) {
      try {
        const productDoc = await adminDb.collection('products').doc(productId).get()
        if (productDoc.exists) {
          finalProductName = productDoc.data()?.name || 'Unknown Product'
        }
      } catch (error) {
        console.error('Error fetching product name:', error)
        finalProductName = 'Unknown Product'
      }
    }

    const questionData = {
      productId,
      productName: finalProductName,
      vendorId,
      userId,
      userName,
      userEmail: userEmail || '',
      question: question.trim(),
      answer: null,
      answeredBy: null,
      answeredAt: null,
      status: 'approved', // Auto-approve for now - can be changed to 'pending' for moderation
      helpful: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const questionRef = await adminDb.collection('questions').add(questionData)

    // Notify vendor about new question
    try {
      await notificationService.createNotification(vendorId, 'new_question', {
        metadata: {
          productId: productId,
          productName: finalProductName,
          userName: userName,
          actionUrl: '/vendor/questions'
        }
      })
    } catch (notificationError) {
      console.error('Failed to send question notification:', notificationError)
      // Don't fail the question submission if notification fails
    }

    return NextResponse.json({
      success: true,
      questionId: questionRef.id,
      message: 'Question submitted successfully. It will be visible once approved.'
    })
  } catch (error) {
    console.error('Error creating question:', error)
    return NextResponse.json(
      { error: 'Failed to submit question' },
      { status: 500 }
    )
  }
}
