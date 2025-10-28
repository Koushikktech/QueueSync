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

    // Call the customer using the service method
    await QueueService.callCustomer(queueId)

    return NextResponse.json({
      success: true,
      message: 'Queue entry called successfully'
    })
  } catch (error) {
    console.error('Error calling queue entry:', error)
    return NextResponse.json(
      { error: 'Failed to call queue entry', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}