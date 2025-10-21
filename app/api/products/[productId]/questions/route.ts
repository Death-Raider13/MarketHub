import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

// GET - Get all questions for a product
export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params

    const questionsSnapshot = await adminDb
      .collection('questions')
      .where('productId', '==', productId)
      .where('status', '==', 'approved')
      .orderBy('createdAt', 'desc')
      .get()

    const questions = questionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString()
    }))

    return NextResponse.json({
      success: true,
      questions
    })
  } catch (error) {
    console.error('Error fetching questions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
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
    const { userId, userName, userEmail, question, vendorId } = await request.json()

    if (!userId || !userName || !question || !vendorId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const questionData = {
      productId,
      vendorId,
      userId,
      userName,
      userEmail: userEmail || '',
      question: question.trim(),
      answer: null,
      answeredBy: null,
      answeredAt: null,
      status: 'pending', // pending, approved, rejected
      helpful: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const questionRef = await adminDb.collection('questions').add(questionData)

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
