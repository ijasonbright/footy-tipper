import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateLeaderboard, getRoundSummary, DEFAULT_COMPETITION_SETTINGS, type CompetitionSettings } from '@/lib/enhanced-scoring-system'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const round = searchParams.get('round')
    const debug = searchParams.get('debug') === 'true'
    const competitionId = params.id

    // Get competition settings
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        users: {
          include: {
            user: true
          }
        }
      }
    })

    if (!competition) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 })
    }

    // Parse competition settings
    const settings: CompetitionSettings = {
      ...DEFAULT_COMPETITION_SETTINGS,
      ...(competition.settings as any || {})
    }

    // Fetch ALL tips first to debug
    const allTips = await prisma.tip.findMany({
      where: { competitionId },
      include: {
        game: true,
        user: {
          select: {
            id: true,
            username: true,
            imageUrl: true
          }
        }
      }
    })

    // Fetch tips with games and users for completed games only
    const whereClause: any = {
      competitionId,
      game: {
        isComplete: true
      }
    }

    if (round) {
      whereClause.game.round = parseInt(round)
    }

    const tips = await prisma.tip.findMany({
      where: whereClause,
      include: {
        game: true,
        user: {
          select: {
            id: true,
            username: true,
            imageUrl: true
          }
        }
      }
    })

    // DEBUG INFO
    if (debug) {
      return NextResponse.json({
        debug: {
          competitionId,
          totalTips: allTips.length,
          completedGameTips: tips.length,
          settings,
          sampleTip: tips[0] || null,
          completedGames: allTips.filter(t => t.game.isComplete).length,
          gameStatus: allTips.slice(0, 5).map(t => ({
            gameId: t.gameId,
            round: t.game.round,
            isComplete: t.game.isComplete,
            homeScore: t.game.homeScore,
            awayScore: t.game.awayScore,
            winner: t.game.winner
          }))
        }
      })
    }

    if (round) {
      // Return round-specific leaderboard
      const roundNum = parseInt(round)
      const roundSummary = getRoundSummary(tips as any, roundNum, settings)
      const roundLeaderboard = calculateLeaderboard(tips as any, settings)

      return NextResponse.json({
        round: roundNum,
        summary: roundSummary,
        leaderboard: roundLeaderboard,
        settings
      })
    } else {
      // Return overall leaderboard
      const leaderboard = calculateLeaderboard(tips as any, settings)
      
      // Get round summaries for all completed rounds (fix Set iteration)
      const roundsSet = new Set<number>()
      tips.forEach(tip => roundsSet.add(tip.game.round))
      const completedRounds = Array.from(roundsSet).sort((a, b) => a - b)
      
      const roundSummaries = completedRounds.map(roundNum => ({
        round: roundNum,
        ...getRoundSummary(tips as any, roundNum, settings)
      }))

      return NextResponse.json({
        leaderboard,
        roundSummaries,
        settings,
        competition: {
          id: competition.id,
          name: competition.name,
          memberCount: competition.users.length
        }
      })
    }
  } catch (error) {
    console.error('Error calculating leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to calculate leaderboard', details: String(error) },
      { status: 500 }
    )
  }
}