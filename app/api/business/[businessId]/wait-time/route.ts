import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      )
    }

    // Get current queue data from Firebase
    const queueSnapshot = await adminDb
      .collection('queues')
      .where('businessId', '==', businessId)
      .where('status', '==', 'waiting')
      .get()

    const queueLength = queueSnapshot.size
    
    // Get business info
    const businessDoc = await adminDb.collection('businesses').doc(businessId).get()
    const businessData = businessDoc.data()

    // Calculate estimated wait time based on business data
    let estimatedWaitTime = queueLength * 10 // Default 10 minutes per person

    if (businessData?.averageServiceTime) {
      estimatedWaitTime = queueLength * businessData.averageServiceTime
    }

    return NextResponse.json({
      businessId,
      queueLength,
      estimatedWaitTime,
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error getting wait time:', error)
    return NextResponse.json(
      { error: 'Failed to get wait time', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}