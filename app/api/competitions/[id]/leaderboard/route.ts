import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateLeaderboard, getRoundSummary, DEFAULT_COMPETITION_SETTINGS, type CompetitionSettings } from '@/lib/enhanced-scoring-system'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: competitionId } = await params
    const { searchParams } = new URL(request.url)
    const round = searchParams.get('round')

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

    // Fetch tips with games and users
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
      { error: 'Failed to calculate leaderboard' },
      { status: 500 }
    )
  }
}

// Update competition settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: competitionId } = await params
    const body = await request.json()
    const { settings } = body

    const updatedCompetition = await prisma.competition.update({
      where: { id: competitionId },
      data: {
        settings: {
          ...DEFAULT_COMPETITION_SETTINGS,
          ...settings
        }
      }
    })

    // Recalculate all scores with new settings
    await recalculateAllScores(competitionId, settings)

    return NextResponse.json({ 
      success: true, 
      competition: updatedCompetition 
    })
  } catch (error) {
    console.error('Error updating competition settings:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}

// Recalculate all scores for a competition
async function recalculateAllScores(competitionId: string, settings: CompetitionSettings) {
  const tips = await prisma.tip.findMany({
    where: { competitionId },
    include: { game: true }
  })

  // Update each tip with recalculated points
  const updatePromises = tips.map(tip => {
    const points = calculateTipPoints(tip, tip.game, settings)
    return prisma.tip.update({
      where: { id: tip.id },
      data: { points }
    })
  })

  await Promise.all(updatePromises)
}

function calculateTipPoints(tip: any, game: any, settings: CompetitionSettings): number {
  if (!game.isComplete || game.winner === null) {
    return 0
  }

  let points = 0

  // Base points for correct tip
  if (tip.predictedWinner === game.winner) {
    points += settings.correctTipPoints

    // Apply confidence multiplier if enabled
    if (settings.confidenceEnabled && tip.confidence) {
      points *= tip.confidence
    }

    // Margin bonus calculation
    if (settings.marginBonusEnabled && tip.margin && game.homeScore !== null && game.awayScore !== null) {
      const actualMargin = Math.abs(game.homeScore - game.awayScore)
      const predictedMargin = Math.abs(tip.margin)
      const marginDiff = Math.abs(actualMargin - predictedMargin)

      if (marginDiff <= settings.marginBonusThreshold) {
        points += settings.marginBonusPoints
      }
    }
  }

  return points
}