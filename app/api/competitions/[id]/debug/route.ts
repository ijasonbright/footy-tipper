import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: competitionId } = await params

    // Get all tips for this competition
    const allTips = await prisma.tip.findMany({
      where: { competitionId },
      include: {
        game: true,
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    })

    // Get completed games
    const completedGames = await prisma.game.findMany({
      where: {
        isComplete: true,
        tips: {
          some: {
            competitionId
          }
        }
      }
    })

    // Check for tips with completed games
    const tipsWithCompletedGames = allTips.filter(tip => tip.game.isComplete)

    return NextResponse.json({
      debug: {
        competitionId,
        totalTips: allTips.length,
        completedGames: completedGames.length,
        tipsWithCompletedGames: tipsWithCompletedGames.length,
        
        // Sample data
        sampleTip: allTips[0] ? {
          id: allTips[0].id,
          gameId: allTips[0].gameId,
          predictedWinner: allTips[0].predictedWinner,
          userId: allTips[0].userId,
          username: allTips[0].user.username
        } : null,

        sampleGame: allTips[0] ? {
          id: allTips[0].game.id,
          round: allTips[0].game.round,
          homeTeam: allTips[0].game.homeTeam,
          awayTeam: allTips[0].game.awayTeam,
          homeScore: allTips[0].game.homeScore,
          awayScore: allTips[0].game.awayScore,
          winner: allTips[0].game.winner,
          isComplete: allTips[0].game.isComplete
        } : null,

        // Check if winner is set on completed games
        completedGamesWithoutWinner: completedGames.filter(g => g.winner === null).map(g => ({
          id: g.id,
          homeTeam: g.homeTeam,
          awayTeam: g.awayTeam,
          homeScore: g.homeScore,
          awayScore: g.awayScore,
          isComplete: g.isComplete,
          winner: g.winner
        })),

        // Show all tips with game status
        allTipsWithGameStatus: allTips.map(tip => ({
          tipId: tip.id,
          user: tip.user.username,
          predictedWinner: tip.predictedWinner,
          game: `${tip.game.homeTeam} vs ${tip.game.awayTeam}`,
          isComplete: tip.game.isComplete,
          winner: tip.game.winner,
          scores: tip.game.isComplete ? `${tip.game.homeScore}-${tip.game.awayScore}` : 'not complete'
        }))
      }
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { error: 'Debug failed', details: String(error) },
      { status: 500 }
    )
  }
}