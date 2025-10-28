import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId') || 'demo-business'
    
    // Get all queue entries for the business
    const queueSnapshot = await adminDb
      .collection('queues')
      .where('businessId', '==', businessId)
      .get()

    const allEntries = queueSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        joinedAt: data.joinedAt?.toDate ? data.joinedAt.toDate().toISOString() : new Date(data.joinedAt || Date.now()).toISOString(),
        calledAt: data.calledAt?.toDate ? data.calledAt.toDate().toISOString() : data.calledAt,
        servedAt: data.servedAt?.toDate ? data.servedAt.toDate().toISOString() : data.servedAt,
        cancelledAt: data.cancelledAt?.toDate ? data.cancelledAt.toDate().toISOString() : data.cancelledAt
      }
    })

    // Separate by status
    const waiting = allEntries.filter(entry => entry.status === 'waiting')
      .sort((a, b) => a.position - b.position)
    
    const called = allEntries.filter(entry => entry.status === 'called')
      .sort((a, b) => new Date(b.calledAt || 0).getTime() - new Date(a.calledAt || 0).getTime())
      .slice(0, 5) // Last 5 called
    
    const served = allEntries.filter(entry => entry.status === 'served')
      .sort((a, b) => new Date(b.servedAt || 0).getTime() - new Date(a.servedAt || 0).getTime())
      .slice(0, 10) // Last 10 served

    // Get business info
    const businessDoc = await adminDb.collection('businesses').doc(businessId).get()
    const businessData = businessDoc.data()

    // Calculate stats
    const queueLength = waiting.length
    const estimatedWaitTime = queueLength * (businessData?.averageServiceTime || 10)
    const totalServedToday = served.length

    return NextResponse.json({
      businessId,
      queueLength,
      estimatedWaitTime,
      totalServedToday,
      waiting,
      called,
      served,
      lastUpdated: new Date().toISOString(),
      businessInfo: {
        name: businessData?.name || 'Demo Restaurant',
        isOpen: businessData?.isOpen ?? true,
        averageServiceTime: businessData?.averageServiceTime || 10
      }
    })
  } catch (error) {
    console.error('Error syncing queue data:', error)
    return NextResponse.json(
      { error: 'Failed to sync queue data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, queueId, businessId } = body
    
    if (!queueId || !action) {
      return NextResponse.json(
        { error: 'Queue ID and action are required' },
        { status: 400 }
      )
    }

    const queueRef = adminDb.collection('queues').doc(queueId)
    
    switch (action) {
      case 'call':
        await queueRef.update({
          status: 'called',
          calledAt: new Date()
        })
        break
        
      case 'serve':
        await queueRef.update({
          status: 'served',
          servedAt: new Date()
        })
        break
        
      case 'cancel':
        await queueRef.update({
          status: 'cancelled',
          cancelledAt: new Date()
        })
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Update business stats if needed
    if (businessId) {
      const queueSnapshot = await adminDb
        .collection('queues')
        .where('businessId', '==', businessId)
        .where('status', '==', 'waiting')
        .get()

      await adminDb.collection('businesses').doc(businessId).update({
        currentQueueLength: queueSnapshot.size,
        updatedAt: new Date()
      })
    }

    return NextResponse.json({
      success: true,
      message: `Queue entry ${action}ed successfully`
    })
  } catch (error) {
    console.error('Error updating queue:', error)
    return NextResponse.json(
      { error: 'Failed to update queue', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}