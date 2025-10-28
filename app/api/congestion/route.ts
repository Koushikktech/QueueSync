import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId') || 'demo-business'

    const businessRef = adminDb.collection('businesses').doc(businessId)
    const businessDoc = await businessRef.get()

    if (!businessDoc.exists) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    const businessData = businessDoc.data()
    const congestionLevel = businessData?.congestionLevel || 'low'

    return NextResponse.json({
      businessId,
      congestionLevel,
      updatedAt: businessData?.congestionUpdatedAt || new Date()
    })
  } catch (error) {
    console.error('Error fetching congestion:', error)
    return NextResponse.json(
      { error: 'Failed to fetch congestion level' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId = 'demo-business', congestionLevel } = body

    if (!['low', 'moderate', 'high'].includes(congestionLevel)) {
      return NextResponse.json(
        { error: 'Invalid congestion level. Must be low, moderate, or high' },
        { status: 400 }
      )
    }

    const businessRef = adminDb.collection('businesses').doc(businessId)
    
    // Update business with congestion level
    await businessRef.update({
      congestionLevel,
      congestionUpdatedAt: new Date(),
      updatedAt: new Date()
    })

    return NextResponse.json({
      success: true,
      businessId,
      congestionLevel,
      updatedAt: new Date()
    })
  } catch (error) {
    console.error('Error updating congestion:', error)
    return NextResponse.json(
      { error: 'Failed to update congestion level' },
      { status: 500 }
    )
  }
}