import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId } = body
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      )
    }

    // Get all waiting queue entries for this business
    const queueSnapshot = await adminDb
      .collection('queues')
      .where('businessId', '==', businessId)
      .where('status', '==', 'waiting')
      .get()

    // Sort by original position and joinedAt time
    const queueEntries = queueSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      joinedAt: doc.data().joinedAt?.toDate?.() || new Date(doc.data().joinedAt)
    })).sort((a, b) => {
      // First sort by position, then by join time for ties
      if (a.position !== b.position) {
        return a.position - b.position
      }
      return a.joinedAt.getTime() - b.joinedAt.getTime()
    })

    // Recalculate positions sequentially
    const batch = adminDb.batch()
    
    queueEntries.forEach((entry, index) => {
      const newPosition = index + 1
      const docRef = adminDb.collection('queues').doc(entry.id)
      
      // Only update if position has changed
      if (entry.position !== newPosition) {
        batch.update(docRef, {
          position: newPosition,
          updatedAt: new Date()
        })
      }
    })

    // Commit all updates
    await batch.commit()

    return NextResponse.json({
      success: true,
      message: 'Queue positions recalculated',
      updatedCount: queueEntries.length
    })
  } catch (error) {
    console.error('Error recalculating queue positions:', error)
    return NextResponse.json(
      { error: 'Failed to recalculate positions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}