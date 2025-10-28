import { NextRequest, NextResponse } from 'next/server'
import { QueueService } from '@/lib/queue-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ queueId: string }> }
) {
  try {
    const { queueId } = await params
    
    if (!queueId) {
      return NextResponse.json(
        { error: 'Queue ID is required' },
        { status: 400 }
      )
    }

    // Serve the customer using the service method
    await QueueService.serveCustomer(queueId)

    return NextResponse.json({
      success: true,
      message: 'Customer checked in successfully'
    })
  } catch (error) {
    console.error('Error checking in customer:', error)
    return NextResponse.json(
      { error: 'Failed to check in customer', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}