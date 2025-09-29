import { Tip, Game, User } from '@prisma/client'

export interface CompetitionSettings {
  // Basic scoring
  correctTipPoints: number
  
  // Bonus systems
  allCorrectBonus: boolean
  allCorrectBonusPoints: number
  
  // Margin settings
  marginMode: 'none' | 'all' | 'first'
  marginBonusEnabled: boolean
  marginBonusThreshold: number
  marginBonusPoints: number
  
  // Confidence system
  confidenceEnabled: boolean
  confidenceMultiplier: number
}

export const DEFAULT_COMPETITION_SETTINGS: CompetitionSettings = {
  correctTipPoints: 1,
  allCorrectBonus: false,
  allCorrectBonusPoints: 0,
  marginMode: 'none',
  marginBonusEnabled: false,
  marginBonusThreshold: 10,
  marginBonusPoints: 1,
  confidenceEnabled: false,
  confidenceMultiplier: 1,
}

export type TipWithGameAndUser = Tip & {
  game: Game
  user: Pick<User, 'id' | 'username' | 'imageUrl'> | User
}

export function calculateTipPoints(
  tip: Tip,
  game: Game,
  settings: CompetitionSettings = DEFAULT_COMPETITION_SETTINGS
): number {
  if (!game.isComplete || game.winner === null) {
    return 0
  }

  let points = 0

  // 🔍 DEBUG: Log the comparison
  console.log(`[SCORING DEBUG] Game: ${game.homeTeam} vs ${game.awayTeam}`)
  console.log(`[SCORING DEBUG] Predicted: ${tip.predictedWinner}, Actual Winner: ${game.winner}`)
  console.log(`[SCORING DEBUG] Match: ${tip.predictedWinner === game.winner}`)

  if (tip.predictedWinner === game.winner) {
    points += settings.correctTipPoints

    if (settings.confidenceEnabled && tip.confidence) {
      points *= tip.confidence
    }

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

export function calculateAllCorrectBonus(
  userTips: TipWithGameAndUser[],
  round: number,
  settings: CompetitionSettings
): number {
  if (!settings.allCorrectBonus) {
    return 0
  }

  const roundTips = userTips.filter(tip => 
    tip.game.round === round && tip.game.isComplete
  )

  if (roundTips.length === 0) {
    return 0
  }

  const allCorrect = roundTips.every(tip => 
    tip.predictedWinner === tip.game.winner
  )

  return allCorrect ? settings.allCorrectBonusPoints : 0
}

export interface UserStanding {
  userId: string
  username: string
  imageUrl?: string
  totalPoints: number
  correctTips: number
  totalTips: number
  percentage: number
  totalMarginDiff: number
  roundBreakdown: RoundResult[]
  position: number
}

export interface RoundResult {
  round: number
  points: number
  correctTips: number
  totalGames: number
  allCorrectBonus: number
  marginDiff: number
}

export function calculateLeaderboard(
  tips: TipWithGameAndUser[],
  settings: CompetitionSettings = DEFAULT_COMPETITION_SETTINGS
): UserStanding[] {
  const userStandings = new Map<string, Omit<UserStanding, 'position'>>()

  const tipsByUser = new Map<string, TipWithGameAndUser[]>()
  tips.forEach(tip => {
    if (!tipsByUser.has(tip.userId)) {
      tipsByUser.set(tip.userId, [])
    }
    tipsByUser.get(tip.userId)!.push(tip)
  })

  tipsByUser.forEach((userTips, userId) => {
    const user = userTips[0].user
    
    const roundGroups = new Map<number, TipWithGameAndUser[]>()
    userTips.forEach(tip => {
      if (!roundGroups.has(tip.game.round)) {
        roundGroups.set(tip.game.round, [])
      }
      roundGroups.get(tip.game.round)!.push(tip)
    })

    let totalPoints = 0
    let correctTips = 0
    let totalTips = 0
    let totalMarginDiff = 0
    const roundBreakdown: RoundResult[] = []

    roundGroups.forEach((roundTips, round) => {
      let roundPoints = 0
      let roundCorrect = 0
      let roundMarginDiff = 0
      const completedRoundTips = roundTips.filter(tip => tip.game.isComplete)

      completedRoundTips.forEach(tip => {
        const tipPoints = calculateTipPoints(tip, tip.game, settings)
        roundPoints += tipPoints
        
        // 🔍 DEBUG: Log each tip comparison
        console.log(`[LEADERBOARD DEBUG] User: ${user.username}, Tip: ${tip.predictedWinner}, Winner: ${tip.game.winner}, Match: ${tip.predictedWinner === tip.game.winner}`)
        
        if (tip.predictedWinner === tip.game.winner) {
          roundCorrect++
        }

        if (tip.margin && tip.game.homeScore !== null && tip.game.awayScore !== null) {
          const actualMargin = Math.abs(tip.game.homeScore - tip.game.awayScore)
          const predictedMargin = Math.abs(tip.margin)
          roundMarginDiff += Math.abs(actualMargin - predictedMargin)
        }

        totalTips++
      })

      const allCorrectBonus = calculateAllCorrectBonus(roundTips, round, settings)
      roundPoints += allCorrectBonus

      totalPoints += roundPoints
      correctTips += roundCorrect
      totalMarginDiff += roundMarginDiff

      roundBreakdown.push({
        round,
        points: roundPoints,
        correctTips: roundCorrect,
        totalGames: completedRoundTips.length,
        allCorrectBonus,
        marginDiff: roundMarginDiff
      })
    })

    const percentage = totalTips > 0 ? (correctTips / totalTips) * 100 : 0

    console.log(`[LEADERBOARD SUMMARY] User: ${user.username}, Correct: ${correctTips}/${totalTips}, Points: ${totalPoints}`)

    userStandings.set(userId, {
      userId,
      username: user.username,
      imageUrl: user.imageUrl || undefined,
      totalPoints,
      correctTips,
      totalTips,
      percentage,
      totalMarginDiff,
      roundBreakdown
    })
  })

  const standings = Array.from(userStandings.values())
  
  standings.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints
    }
    if (a.totalMarginDiff !== b.totalMarginDiff) {
      return a.totalMarginDiff - b.totalMarginDiff
    }
    return b.percentage - a.percentage
  })

  return standings.map((standing, index) => ({
    ...standing,
    position: index + 1
  }))
}

export function getRoundSummary(
  tips: TipWithGameAndUser[],
  round: number,
  settings: CompetitionSettings = DEFAULT_COMPETITION_SETTINGS
): {
  totalGames: number
  completedGames: number
  participants: number
  averageScore: number
  perfectRounds: number
} {
  const roundTips = tips.filter(tip => tip.game.round === round)
  const completedTips = roundTips.filter(tip => tip.game.isComplete)
  
  const userScores = new Map<string, number>()
  const userGameCounts = new Map<string, { total: number; correct: number }>()

  completedTips.forEach(tip => {
    const points = calculateTipPoints(tip, tip.game, settings)
    
    if (!userScores.has(tip.userId)) {
      userScores.set(tip.userId, 0)
      userGameCounts.set(tip.userId, { total: 0, correct: 0 })
    }
    
    userScores.set(tip.userId, userScores.get(tip.userId)! + points)
    
    const gameCount = userGameCounts.get(tip.userId)!
    gameCount.total++
    if (tip.predictedWinner === tip.game.winner) {
      gameCount.correct++
    }
  })

  userScores.forEach((score, userId) => {
    const userRoundTips = roundTips.filter(tip => tip.userId === userId)
    const bonus = calculateAllCorrectBonus(userRoundTips, round, settings)
    userScores.set(userId, score + bonus)
  })

  const gameIdsSet = new Set<string>()
  roundTips.forEach(tip => gameIdsSet.add(tip.gameId))
  const totalGames = Array.from(gameIdsSet).length
  
  const completedGameIdsSet = new Set<string>()
  completedTips.forEach(tip => completedGameIdsSet.add(tip.gameId))
  const completedGames = Array.from(completedGameIdsSet).length
  
  const participants = userScores.size
  
  const scores = Array.from(userScores.values())
  const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
  
  const perfectRounds = Array.from(userGameCounts.values()).filter(
    count => count.total > 0 && count.correct === count.total
  ).length

  return {
    totalGames,
    completedGames,
    participants,
    averageScore,
    perfectRounds
  }
}