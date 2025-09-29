import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: gameId } = await params
    const body = await request.json()
    const { homeScore, awayScore } = body

    // Get the game to find team IDs
    const game = await prisma.game.findUnique({
      where: { id: gameId }
    })

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    // Determine winner
    const winner = homeScore > awayScore ? game.homeTeamId : game.awayTeamId
    const margin = Math.abs(homeScore - awayScore)

    // Update the game
    const updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: {
        homeScore,
        awayScore,
        winner,
        margin,
        isComplete: true,
        completedAt: new Date()
      }
    })

    // Optionally: Trigger score recalculation
    // await recalculateScoresForGame(gameId)

    return NextResponse.json({ 
      success: true, 
      game: updatedGame 
    })
  } catch (error) {
    console.error('Error completing game:', error)
    return NextResponse.json(
      { error: 'Failed to complete game' },
      { status: 500 }
    )
  }
}