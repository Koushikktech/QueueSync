import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { MLService } from '@/lib/ml-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId, userInfo } = body
    
    if (!businessId || !userInfo?.name) {
      return NextResponse.json(
        { error: 'Business ID and user name are required' },
        { status: 400 }
      )
    }

    // Ensure business exists, create if it doesn't
    const businessRef = adminDb.collection('businesses').doc(businessId)
    const businessDoc = await businessRef.get()
    
    if (!businessDoc.exists) {
      // Create demo business
      await businessRef.set({
        name: businessId === 'demo-business' ? 'Demo Restaurant' : 'Sample Business',
        description: 'A sample business for testing',
        category: 'restaurant',
        averageServiceTime: 10,
        currentQueueLength: 0,
        isOpen: true,
        location: {
          address: '123 Demo Street',
          coordinates: { lat: 40.7128, lng: -74.0060 }
        },
        settings: {
          maxQueueSize: 50,
          estimatedServiceTime: 10,
          allowPhoneNotifications: true,
          allowEmailNotifications: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    // Get current queue length (simplified query to avoid index requirement)
    const queueSnapshot = await adminDb
      .collection('queues')
      .where('businessId', '==', businessId)
      .where('status', '==', 'waiting')
      .get()

    // Calculate next position by finding the highest position + 1
    let maxPosition = 0
    queueSnapshot.forEach(doc => {
      const data = doc.data()
      if (data.position > maxPosition) {
        maxPosition = data.position
      }
    })
    
    const position = maxPosition + 1
    
    // Try to get ML prediction for wait time
    let estimatedWaitTime = position * 10 // Fallback calculation
    let mlPredicted = false
    
    try {
      const isMLAvailable = await MLService.isMLServiceAvailable()
      
      if (isMLAvailable && userInfo.partySize) {
        const currentHour = new Date().getHours()
        const queueSize = queueSnapshot.size
        
        const mlWaitTime = await MLService.getUpdatedWaitTime({
          queueSize,
          currentHour,
          partySize: userInfo.partySize,
        })
        
        estimatedWaitTime = mlWaitTime
        mlPredicted = true
        console.log(`ML prediction: ${mlWaitTime} minutes for party of ${userInfo.partySize}`)
      }
    } catch (mlError) {
      console.warn('ML prediction failed, using fallback:', mlError)
    }

    const queueEntry = {
      userId: `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      businessId,
      position,
      estimatedWaitTime,
      joinedAt: new Date(),
      status: 'waiting',
      userInfo,
      mlPredicted,
      lastUpdated: new Date()
    }

    // Add to queue
    const docRef = await adminDb.collection('queues').add(queueEntry)

    // Update business queue length
    await businessRef.update({
      currentQueueLength: position,
      updatedAt: new Date()
    })

    const queueStatus = {
      id: docRef.id,
      ...queueEntry
    }
    
    return NextResponse.json({
      queueId: docRef.id,
      status: queueStatus
    })
  } catch (error) {
    console.error('Error joining queue:', error)
    return NextResponse.json(
      { error: 'Failed to join queue', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}