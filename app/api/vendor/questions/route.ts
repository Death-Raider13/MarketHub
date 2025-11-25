import { NextRequest, NextResponse } from 'next/server'
import { getAdminFirestore } from '@/lib/firebase/admin'

export const dynamic = 'force-dynamic'

// GET - Get all questions for a vendor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
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

    console.log('Loading questions for vendor:', vendorId)

    // Get all questions for the vendor
    const questionsSnapshot = await adminDb
      .collection('questions')
      .where('vendorId', '==', vendorId)
      .get()

    console.log('Found', questionsSnapshot.docs.length, 'questions for vendor')

    const questions = questionsSnapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      answeredAt: doc.data().answeredAt?.toDate?.()?.toISOString() || null
    }))

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

    // Sort questions by creation date (newest first)
    questions.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({
      success: true,
      questions
    })
  } catch (error) {
    console.error('Error fetching vendor questions:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch questions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
