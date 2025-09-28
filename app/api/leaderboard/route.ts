import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { calculateTipPoints } from '@/lib/scoring'

interface LeaderboardEntry {
  userId: string
  username: string
  imageUrl?: string
  totalPoints: number
  correctTips: number
  totalTips: number
  rank: number
  change?: number
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const competitionId = url.searchParams.get('competitionId')
    const round = parseInt(url.searchParams.get('round') || '0')

    if (!competitionId) {
      return NextResponse.json({ error: 'Competition ID required' }, { status: 400 })
    }

    // Verify user is member of competition
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const membership = await prisma.competitionUser.findUnique({
      where: {
        userId_competitionId: {
          userId: user.id,
          competitionId
        }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this competition' }, { status: 403 })
    }

    // Get leaderboard data
    const leaderboard = await generateLeaderboard(competitionId, round)

    return NextResponse.json({ leaderboard })
  } catch (error) {
    console.error('Error getting leaderboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateLeaderboard(competitionId: string, upToRound?: number): Promise<LeaderboardEntry[]> {
  try {
    // Get all competition members
    const members = await prisma.competitionUser.findMany({
      where: { competitionId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            imageUrl: true
          }
        }
      }
    })

    // Get all tips for the competition
    let tipFilters: any = {
      competitionId,
      game: {
        isComplete: true // Only count completed games
      }
    }

    // Filter by round if specified
    if (upToRound && upToRound > 0) {
      tipFilters.game.round = { lte: upToRound }
    }

    const allTips = await prisma.tip.findMany({
      where: tipFilters,
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

    // Calculate standings for each user
    const userStandings = new Map<string, {
      userId: string
      username: string
      imageUrl?: string
      totalPoints: number
      correctTips: number
      totalTips: number
    }>()

    // Initialize all members
    members.forEach(member => {
      userStandings.set(member.userId, {
        userId: member.userId,
        username: member.user.username,
        imageUrl: member.user.imageUrl || undefined,
        totalPoints: 0,
        correctTips: 0,
        totalTips: 0
      })
    })

    // Calculate points and stats
    allTips.forEach(tip => {
      const standing = userStandings.get(tip.userId)
      if (!standing) return

      standing.totalTips += 1

      // Calculate points for this tip
      const points = calculateTipPoints(tip, tip.game)
      standing.totalPoints += points

      // Count correct tips (any points = correct)
      if (points > 0) {
        standing.correctTips += 1
      }
    })

    // Convert to array and sort
    const standings = Array.from(userStandings.values())
      .sort((a, b) => {
        // Sort by total points (desc), then by correct tips (desc), then by username (asc)
        if (b.totalPoints !== a.totalPoints) {
          return b.totalPoints - a.totalPoints
        }
        if (b.correctTips !== a.correctTips) {
          return b.correctTips - a.correctTips
        }
        return a.username.localeCompare(b.username)
      })

    // Add rankings and position changes
    const leaderboard: LeaderboardEntry[] = standings.map((standing, index) => ({
      ...standing,
      rank: index + 1,
      change: undefined // TODO: Calculate position change from previous round
    }))

    return leaderboard
  } catch (error) {
    console.error('Error generating leaderboard:', error)
    throw error
  }
}

// Helper function to calculate position changes
async function calculatePositionChanges(
  currentLeaderboard: LeaderboardEntry[],
  competitionId: string,
  currentRound: number
): Promise<LeaderboardEntry[]> {
  try {
    if (currentRound <= 1) {
      // No previous round to compare
      return currentLeaderboard
    }

    // Get previous round leaderboard
    const previousLeaderboard = await generateLeaderboard(competitionId, currentRound - 1)
    
    // Create lookup for previous positions
    const previousPositions = new Map<string, number>()
    previousLeaderboard.forEach(entry => {
      previousPositions.set(entry.userId, entry.rank)
    })

    // Calculate changes
    return currentLeaderboard.map(entry => ({
      ...entry,
      change: previousPositions.has(entry.userId) 
        ? previousPositions.get(entry.userId)! - entry.rank 
        : undefined
    }))
  } catch (error) {
    console.error('Error calculating position changes:', error)
    return currentLeaderboard // Return without changes if error
  }
}

// Alternative endpoint for round-specific leaderboards with position changes
export async function getLeaderboardWithChanges(competitionId: string, round: number) {
  const currentLeaderboard = await generateLeaderboard(competitionId, round)
  return await calculatePositionChanges(currentLeaderboard, competitionId, round)
}