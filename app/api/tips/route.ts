import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, competitionId, tips, gameIds } = body

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify user is a member of the competition
    const membership = await prisma.competitionUser.findUnique({
      where: {
        userId_competitionId: {
          userId: user.id,
          competitionId: competitionId
        }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this competition' }, { status: 403 })
    }

    switch (action) {
      case 'get':
        // Get user's tips for specified games
        if (!gameIds || !Array.isArray(gameIds)) {
          return NextResponse.json({ error: 'Game IDs required' }, { status: 400 })
        }

        const userTips = await prisma.tip.findMany({
          where: {
            userId: user.id,
            competitionId: competitionId,
            gameId: { in: gameIds }
          }
        })

        return NextResponse.json(userTips)

      case 'save':
        // Save multiple tips
        if (!tips || !Array.isArray(tips)) {
          return NextResponse.json({ error: 'Tips array required' }, { status: 400 })
        }

        const savedTips = []

        for (const tip of tips) {
          const { gameId, predictedWinner, margin, confidence } = tip

          if (!gameId || !predictedWinner) {
            continue // Skip invalid tips
          }

          // Check if tip deadline has passed
          // For now, we'll allow all tips in testing mode
          // TODO: Add deadline checking when using live data

          try {
            const savedTip = await prisma.tip.upsert({
              where: {
                userId_gameId_competitionId: {
                  userId: user.id,
                  gameId: gameId,
                  competitionId: competitionId
                }
              },
              update: {
                predictedWinner: predictedWinner,
                margin: margin || null,
                confidence: confidence || null,
                updatedAt: new Date()
              },
              create: {
                userId: user.id,
                gameId: gameId,
                competitionId: competitionId,
                predictedWinner: predictedWinner,
                margin: margin || null,
                confidence: confidence || null
              }
            })

            savedTips.push(savedTip)
          } catch (error) {
            console.error('Error saving tip:', error)
          }
        }

        return NextResponse.json({
          message: `Saved ${savedTips.length} tips`,
          tips: savedTips
        })

      case 'delete':
        // Delete a specific tip
        const { gameId: gameToDelete } = body

        if (!gameToDelete) {
          return NextResponse.json({ error: 'Game ID required' }, { status: 400 })
        }

        await prisma.tip.deleteMany({
          where: {
            userId: user.id,
            gameId: gameToDelete,
            competitionId: competitionId
          }
        })

        return NextResponse.json({ message: 'Tip deleted' })

      case 'get_round':
        // Get all tips for a specific round
        const { round, season = 2025 } = body

        if (!round) {
          return NextResponse.json({ error: 'Round number required' }, { status: 400 })
        }

        // First get all games for this round
        const roundGames = await prisma.game.findMany({
          where: {
            round: round,
            season: season
          }
        })

        const roundGameIds = roundGames.map(game => game.id)

        // Get user's tips for these games
        const roundTips = await prisma.tip.findMany({
          where: {
            userId: user.id,
            competitionId: competitionId,
            gameId: { in: roundGameIds }
          }
        })

        return NextResponse.json({
          round,
          tips: roundTips,
          totalGames: roundGames.length,
          completedTips: roundTips.length
        })

      case 'get_competition_tips':
        // Get all user's tips for the entire competition
        const allUserTips = await prisma.tip.findMany({
          where: {
            userId: user.id,
            competitionId: competitionId
          },
          orderBy: [
            { createdAt: 'desc' }
          ]
        })

        return NextResponse.json(allUserTips)

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in tips API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const competitionId = searchParams.get('competitionId')
    const round = searchParams.get('round')
    const gameId = searchParams.get('gameId')

    if (!competitionId) {
      return NextResponse.json({ error: 'Competition ID required' }, { status: 400 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let tips

    if (gameId) {
      // Get tip for a specific game
      tips = await prisma.tip.findUnique({
        where: {
          userId_gameId_competitionId: {
            userId: user.id,
            gameId: gameId,
            competitionId: competitionId
          }
        }
      })
    } else if (round) {
      // Get tips for a specific round
      const getGamesForRound = await prisma.game.findMany({
        where: {
          round: parseInt(round),
          season: 2025 // TODO: Make this dynamic
        }
      })

      const getGameIds = getGamesForRound.map(game => game.id)

      tips = await prisma.tip.findMany({
        where: {
          userId: user.id,
          competitionId: competitionId,
          gameId: { in: getGameIds }
        }
      })
    } else {
      // Get all tips for the competition
      tips = await prisma.tip.findMany({
        where: {
          userId: user.id,
          competitionId: competitionId
        },
        orderBy: [
          { createdAt: 'desc' }
        ]
      })
    }

    return NextResponse.json(tips)

  } catch (error) {
    console.error('Error in tips GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}