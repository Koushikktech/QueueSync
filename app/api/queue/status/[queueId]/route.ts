import { NextRequest, NextResponse } from 'next/server'
import { QueueService } from '@/lib/queue-service'

export async function GET(
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
    
    const queueStatus = await QueueService.getQueueStatus(queueId)
    
    if (!queueStatus) {
      return NextResponse.json(
        { error: 'Queue entry not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(queueStatus)
  } catch (error) {
    console.error('Error getting queue status:', error)
    return NextResponse.json(
      { error: 'Failed to get queue status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}