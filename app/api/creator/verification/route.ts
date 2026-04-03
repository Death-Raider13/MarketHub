import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin-simple';
import { verifyAuthToken } from '@/lib/api-auth';
import { logger } from '@/lib/logger';

// GET - Fetch verification status for a creator
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const adminDb = getAdminFirestore();
    if (!adminDb) return NextResponse.json({ error: 'Database error' }, { status: 500 });

    // Check creator's verification status
    const creatorDoc = await adminDb.collection('creators').doc(userId).get();
    
    if (!creatorDoc.exists) {
      return NextResponse.json({ status: 'none', documents: [] });
    }

    const creatorData = creatorDoc.data();
    
    // Fetch associated verification documents
    const docsSnapshot = await adminDb
      .collection('verification_documents')
      .where('userId', '==', userId)
      .orderBy('uploadedAt', 'desc')
      .get();

    const documents = docsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      status: creatorData?.verificationStatus || 'none',
      academicTier: creatorData?.academicTier || null,
      institutionAffiliation: creatorData?.institutionAffiliation || null,
      documents,
    });

  } catch (error: any) {
    logger.error('Error fetching verification status:', error);
    return NextResponse.json({ error: 'Failed to fetch verification status' }, { status: 500 });
  }
}

// POST - Submit verification documents
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await verifyAuthToken(request);
    if ('error' in authResult) {
      return authResult.error;
    }

    const { user } = authResult;
    const adminDb = getAdminFirestore();
    if (!adminDb) return NextResponse.json({ error: 'Database error' }, { status: 500 });

    const body = await request.json();
    const { 
      userId, 
      documentType, 
      documentUrl, 
      institutionName, 
      graduationYear, 
      additionalNotes 
    } = body;

    // Security: ensure the authenticated user matches
    if (userId !== user.uid) {
      logger.warn(`Security: Mismatched userId in verification. token=${user.uid}, body=${userId}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Validate required fields
    if (!documentType || !documentUrl || !institutionName) {
      return NextResponse.json(
        { error: 'documentType, documentUrl, and institutionName are required' },
        { status: 400 }
      );
    }

    // Allowed document types
    const allowedDocTypes = [
      'student-id',
      'school-certificate',
      'university-degree',
      'transcript',
      'nysc-certificate',
      'professional-license',
      'admission-letter',
    ];

    if (!allowedDocTypes.includes(documentType)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
    }

    // Store verification document
    const verificationDoc = {
      userId,
      type: documentType,
      url: documentUrl,
      institutionName: institutionName.trim(),
      graduationYear: graduationYear?.trim() || null,
      additionalNotes: additionalNotes?.trim() || null,
      status: 'pending',
      uploadedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      reviewNote: null,
    };

    const docRef = await adminDb.collection('verification_documents').add(verificationDoc);

    // Update creator's verification status to pending
    await adminDb.collection('creators').doc(userId).update({
      verificationStatus: 'pending',
      institutionAffiliation: institutionName.trim(),
      updatedAt: new Date(),
    });

    logger.info(`Verification submitted: ${docRef.id} by user: ${userId}`);

    return NextResponse.json({
      success: true,
      documentId: docRef.id,
      message: 'Verification documents submitted successfully',
    }, { status: 201 });

  } catch (error: any) {
    logger.error('Error submitting verification:', error);
    return NextResponse.json({ error: 'Failed to submit verification' }, { status: 500 });
  }
}
