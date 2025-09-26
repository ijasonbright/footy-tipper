import { Tip, Game } from '@prisma/client'

export interface ScoringSettings {
  correctTipPoints: number
  marginBonusEnabled: boolean
  marginBonusThreshold: number
  marginBonusPoints: number
  confidenceEnabled: boolean
  confidenceMultiplier: number
}

export const DEFAULT_SCORING: ScoringSettings = {
  correctTipPoints: 1,
  marginBonusEnabled: false,
  marginBonusThreshold: 10,
  marginBonusPoints: 1,
  confidenceEnabled: false,
  confidenceMultiplier: 1,
}

// Calculate points for a single tip
export function calculateTipPoints(
  tip: Tip,
  game: Game,
  settings: ScoringSettings = DEFAULT_SCORING
): number {
  if (!game.isComplete || game.winner === null) {
    return 0
  }

  let points = 0

  // Base points for correct tip
  if (tip.predictedWinner === game.winner) {
    points += settings.correctTipPoints

    // Confidence multiplier
    if (settings.confidenceEnabled && tip.confidence) {
      points *= tip.confidence * settings.confidenceMultiplier
    }

    // Margin bonus
    if (settings.marginBonusEnabled && tip.margin && game.homeScore && game.awayScore) {
      const actualMargin = Math.abs((game.homeScore || 0) - (game.awayScore || 0))
      const predictedMargin = Math.abs(tip.margin)
      const marginDiff = Math.abs(actualMargin - predictedMargin)

      if (marginDiff <= settings.marginBonusThreshold) {
        points += settings.marginBonusPoints
      }
    }
  }

  return points
}

// Calculate total points for multiple tips
export function calculateTotalPoints(
  tips: (Tip & { game: Game })[],
  settings: ScoringSettings = DEFAULT_SCORING
): number {
  return tips.reduce((total, tip) => {
    return total + calculateTipPoints(tip, tip.game, settings)
  }, 0)
}

// Calculate competition standings
export interface UserStanding {
  userId: string
  username: string
  totalPoints: number
  correctTips: number
  totalTips: number
  percentage: number
  roundPoints: { round: number; points: number }[]
}

export function calculateStandings(
  tips: (Tip & { 
    game: Game 
    user: { id: string; username: string }
  })[],
  settings: ScoringSettings = DEFAULT_SCORING
): UserStanding[] {
  const userStandings = new Map<string, UserStanding>()

  tips.forEach(tip => {
    const userId = tip.user.id
    const points = calculateTipPoints(tip, tip.game, settings)
    
    if (!userStandings.has(userId)) {
      userStandings.set(userId, {
        userId,
        username: tip.user.username,
        totalPoints: 0,
        correctTips: 0,
        totalTips: 0,
        percentage: 0,
        roundPoints: []
      })
    }

    const standing = userStandings.get(userId)!
    standing.totalPoints += points
    standing.totalTips += 1

    if (points > 0) {
      standing.correctTips += 1
    }

    // Track round points
    const existingRoundPoints = standing.roundPoints.find(rp => rp.round === tip.game.round)
    if (existingRoundPoints) {
      existingRoundPoints.points += points
    } else {
      standing.roundPoints.push({ round: tip.game.round, points })
    }
  })

  // Calculate percentages and sort
  const standings = Array.from(userStandings.values()).map(standing => ({
    ...standing,
    percentage: standing.totalTips > 0 ? (standing.correctTips / standing.totalTips) * 100 : 0
  }))

  // Sort by total points (desc), then by percentage (desc), then by correct tips (desc)
  return standings.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints
    }
    if (b.percentage !== a.percentage) {
      return b.percentage - a.percentage
    }
    return b.correctTips - a.correctTips
  })
}

// Get round summary for a user
export interface RoundSummary {
  round: number
  totalGames: number
  tippedGames: number
  correctTips: number
  points: number
  percentage: number
}

export function getRoundSummary(
  tips: (Tip & { game: Game })[],
  round: number,
  settings: ScoringSettings = DEFAULT_SCORING
): RoundSummary {
  const roundTips = tips.filter(tip => tip.game.round === round)
  const completedTips = roundTips.filter(tip => tip.game.isComplete)
  
  const correctTips = completedTips.filter(tip => 
    calculateTipPoints(tip, tip.game, settings) > 0
  ).length
  
  const points = completedTips.reduce((total, tip) => 
    total + calculateTipPoints(tip, tip.game, settings), 0
  )

  return {
    round,
    totalGames: roundTips.length,
    tippedGames: roundTips.length,
    correctTips,
    points,
    percentage: completedTips.length > 0 ? (correctTips / completedTips.length) * 100 : 0
  }
}

// Prediction accuracy helpers
export function getPredictionAccuracy(tips: (Tip & { game: Game })[]): {
  overall: number
  byRound: { round: number; accuracy: number; total: number }[]
} {
  const completedTips = tips.filter(tip => tip.game.isComplete)
  const correctTips = completedTips.filter(tip => tip.predictedWinner === tip.game.winner)
  
  const overall = completedTips.length > 0 ? (correctTips.length / completedTips.length) * 100 : 0

  // Calculate by round
  const roundAccuracy = new Map<number, { correct: number; total: number }>()
  
  completedTips.forEach(tip => {
    const round = tip.game.round
    if (!roundAccuracy.has(round)) {
      roundAccuracy.set(round, { correct: 0, total: 0 })
    }
    
    const stats = roundAccuracy.get(round)!
    stats.total += 1
    if (tip.predictedWinner === tip.game.winner) {
      stats.correct += 1
    }
  })

  const byRound = Array.from(roundAccuracy.entries())
    .map(([round, stats]) => ({
      round,
      accuracy: (stats.correct / stats.total) * 100,
      total: stats.total
    }))
    .sort((a, b) => a.round - b.round)

  return { overall, byRound }
}
