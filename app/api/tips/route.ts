import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, competitionId, tips, gameIds } = body

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      // Create user if doesn't exist
      const clerkUser = await currentUser()
      const email = clerkUser?.emailAddresses?.[0]?.emailAddress || ''
      const username = clerkUser?.username || email.split('@')[0] || `user_${userId.slice(-8)}`
      
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email,
          username,
          firstName: clerkUser?.firstName || null,
          lastName: clerkUser?.lastName || null,
          imageUrl: clerkUser?.imageUrl || null
        }
      })
      console.log('Created new user:', user.id)
    }

    // Temporarily disable competition membership check for testing
    // TODO: Re-enable when competition system is fully implemented
    /*
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
    */

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

        console.log(`Attempting to save ${tips.length} tips for user ${user.id}`)

        const savedTips = []
        const errors: Array<{ gameId: string; error: string }> = []

        for (const tip of tips) {
          const { gameId, predictedWinner, margin, confidence } = tip

          if (!gameId || !predictedWinner) {
            console.log('Skipping invalid tip:', tip)
            continue
          }

          try {
            // First check if the game exists in the database
            const gameExists = await prisma.game.findUnique({
              where: { id: gameId }
            })

            if (!gameExists) {
              console.log(`Game ${gameId} doesn't exist in database, creating it...`)
              
              // For testing mode, create a placeholder game
              // In production, games should be pre-loaded from Squiggle API
              await prisma.game.create({
                data: {
                  id: gameId,
                  squiggleId: `test_${gameId}`,
                  round: 1, // Default for testing
                  season: 2025,
                  homeTeam: 'Test Home Team',
                  awayTeam: 'Test Away Team',
                  homeTeamId: 1,
                  awayTeamId: 2,
                  venue: 'Test Venue',
                  date: new Date(),
                  isComplete: false
                }
              })
              console.log(`Created placeholder game ${gameId}`)
            }

            // Now save the tip
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
            console.log(`Successfully saved tip for game ${gameId}`)

          } catch (error) {
            console.error(`Error saving tip for game ${gameId}:`, error)
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            errors.push({ gameId, error: errorMessage })
          }
        }

        console.log(`Saved ${savedTips.length} tips, ${errors.length} errors`)

        return NextResponse.json({
          success: true,
          message: `Saved ${savedTips.length} tips`,
          savedCount: savedTips.length,
          tips: savedTips,
          errors: errors.length > 0 ? errors : undefined
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 })
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
          season: 2025
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