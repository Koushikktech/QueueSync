import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    // Create demo business data
    const demoBusiness = {
      name: 'Demo Restaurant',
      description: 'A sample restaurant for testing the queue system',
      category: 'restaurant',
      averageServiceTime: 12, // 12 minutes per customer
      currentQueueLength: 0,
      isOpen: true,
      location: {
        address: '123 Demo Street, Demo City',
        coordinates: {
          lat: 40.7128,
          lng: -74.0060
        }
      },
      settings: {
        maxQueueSize: 50,
        estimatedServiceTime: 12,
        allowPhoneNotifications: true,
        allowEmailNotifications: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Save to Firebase
    await adminDb.collection('businesses').doc('demo-business').set(demoBusiness)

    return NextResponse.json({
      success: true,
      message: 'Demo business created successfully',
      businessId: 'demo-business'
    })
  } catch (error) {
    console.error('Error creating demo business:', error)
    return NextResponse.json(
      { error: 'Failed to create demo business', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}