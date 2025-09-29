import { prisma } from '@/lib/db'
import { calculateTipPoints, calculateAllCorrectBonus, type CompetitionSettings, DEFAULT_COMPETITION_SETTINGS } from '@/lib/enhanced-scoring-system'

export async function recalculateScoresForCompletedGames() {
  try {
    // Get all competitions
    const competitions = await prisma.competition.findMany({
      where: { isActive: true }
    })

    for (const competition of competitions) {
      await recalculateCompetitionScores(competition.id, competition.settings as unknown as CompetitionSettings)
    }

    console.log('Successfully recalculated scores for all competitions')
  } catch (error) {
    console.error('Error recalculating scores:', error)
  }
}

export async function recalculateCompetitionScores(competitionId: string, settings?: any) {
  const competitionSettings: CompetitionSettings = {
    ...DEFAULT_COMPETITION_SETTINGS,
    ...settings
  }

  // Get all tips for completed games in this competition
  const tips = await prisma.tip.findMany({
    where: {
      competitionId,
      game: {
        isComplete: true
      }
    },
    include: {
      game: true,
      user: true
    }
  })

  // Group tips by user and round for all correct bonus calculation
  const tipsByUserAndRound = new Map<string, Map<number, typeof tips>>()
  
  tips.forEach(tip => {
    if (!tipsByUserAndRound.has(tip.userId)) {
      tipsByUserAndRound.set(tip.userId, new Map())
    }
    
    const userRounds = tipsByUserAndRound.get(tip.userId)!
    if (!userRounds.has(tip.game.round)) {
      userRounds.set(tip.game.round, [])
    }
    
    userRounds.get(tip.game.round)!.push(tip)
  })

  // Calculate points for each tip
  const updatePromises: Promise<any>[] = []

  for (const tip of tips) {
    let points = calculateTipPoints(tip, tip.game, competitionSettings)
    
    // Add all correct bonus if applicable
    if (competitionSettings.allCorrectBonus) {
      const userRoundTips = tipsByUserAndRound.get(tip.userId)?.get(tip.game.round) || []
      const allCorrectBonus = calculateAllCorrectBonus(userRoundTips, tip.game.round, competitionSettings)
      
      // Only add bonus to first tip of the round to avoid double-counting
      const isFirstTipInRound = userRoundTips[0]?.id === tip.id
      if (isFirstTipInRound) {
        points += allCorrectBonus
      }
    }

    updatePromises.push(
      prisma.tip.update({
        where: { id: tip.id },
        data: { points }
      })
    )
  }

  await Promise.all(updatePromises)

  // Update total points for each user in the competition
  await updateCompetitionUserTotals(competitionId)
}

async function updateCompetitionUserTotals(competitionId: string) {
  const userTotals = await prisma.tip.groupBy({
    by: ['userId'],
    where: { competitionId },
    _sum: {
      points: true
    }
  })

  const updatePromises = userTotals.map(userTotal => 
    prisma.competitionUser.update({
      where: {
        userId_competitionId: {
          userId: userTotal.userId,
          competitionId
        }
      },
      data: {
        totalPoints: userTotal._sum.points || 0
      }
    })
  )

  await Promise.all(updatePromises)
}

// Function to be called when a game is marked as complete
export async function onGameCompleted(gameId: string) {
  try {
    // Get all competitions that have tips for this game
    const competitions = await prisma.competition.findMany({
      where: {
        tips: {
          some: {
            gameId
          }
        }
      }
    })

    // Recalculate scores for each competition
    for (const competition of competitions) {
      await recalculateCompetitionScores(competition.id, competition.settings as unknown as CompetitionSettings)
    }

    console.log(`Recalculated scores for game ${gameId}`)
  } catch (error) {
    console.error('Error recalculating scores for completed game:', error)
  }
}

// Cron job or webhook handler
export async function scoreCalculationHandler() {
  // This could be called by:
  // 1. A cron job every 15 minutes during game days
  // 2. A webhook from the AFL data provider
  // 3. A manual admin trigger
  
  await recalculateScoresForCompletedGames()
}