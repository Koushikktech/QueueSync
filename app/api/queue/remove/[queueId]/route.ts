import { NextRequest, NextResponse } from 'next/server'
import { QueueService } from '@/lib/queue-service'

export async function DELETE(
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

    // Remove the customer using the service method
    await QueueService.removeCustomer(queueId)

    return NextResponse.json({
      success: true,
      message: 'Queue entry removed successfully'
    })
  } catch (error) {
    console.error('Error removing queue entry:', error)
    return NextResponse.json(
      { error: 'Failed to remove queue entry', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}