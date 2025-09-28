import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { calculateTipPoints } from '@/lib/scoring'

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
        // Get user's tips for specified games WITH RESULTS AND RANKINGS
        if (!gameIds || !Array.isArray(gameIds)) {
          return NextResponse.json({ error: 'Game IDs required' }, { status: 400 })
        }
        
        const userTipsWithResults = await getUserTipsWithResults(user.id, competitionId, gameIds)
        return NextResponse.json(userTipsWithResults)

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
                  squiggleId: `test_${gameId.slice(-6)}`, // Fixed: String instead of number
                  round: 1, // Default for testing
                  year: 2025,
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
        
        // After saving tips, calculate results for any completed games
        await calculateResultsForSavedTips(savedTips, competitionId)
        
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
            year: season
          }
        })
        const roundGameIds = roundGames.map(game => game.id)
        // Get user's tips for these games WITH RESULTS
        const roundTipsWithResults = await getUserTipsWithResults(user.id, competitionId, roundGameIds)
        
        return NextResponse.json({
          round,
          tips: roundTipsWithResults,
          totalGames: roundGames.length,
          completedTips: roundTipsWithResults.length
        })

      case 'get_competition_tips':
        // Get all user's tips for the entire competition
        const allUserTips = await prisma.tip.findMany({
          where: {
            userId: user.id,
            competitionId: competitionId
          },
          include: {
            game: true
          },
          orderBy: [
            { createdAt: 'desc' }
          ]
        })
        
        // Add results calculation
        const tipsWithResults = await addResultsToTips(allUserTips, competitionId)
        return NextResponse.json(tipsWithResults)

      case 'calculate_results':
        // NEW ACTION: Force recalculate results for all tips in competition
        await recalculateAllResults(competitionId)
        return NextResponse.json({ message: 'Results recalculated successfully' })

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
      // Get tip for a specific game WITH RESULTS
      const tipData = await prisma.tip.findUnique({
        where: {
          userId_gameId_competitionId: {
            userId: user.id,
            gameId: gameId,
            competitionId: competitionId
          }
        },
        include: {
          game: true
        }
      })
      
      if (tipData) {
        const resultsArray = await addResultsToTips([tipData], competitionId)
        tips = resultsArray[0] // Return single tip, not array
      }
    } else if (round) {
      // Get tips for a specific round WITH RESULTS
      const getGamesForRound = await prisma.game.findMany({
        where: {
          round: parseInt(round),
          year: 2025
        }
      })
      const getGameIds = getGamesForRound.map(game => game.id)
      
      tips = await getUserTipsWithResults(user.id, competitionId, getGameIds)
    } else {
      // Get all tips for the competition WITH RESULTS
      const allTips = await prisma.tip.findMany({
        where: {
          userId: user.id,
          competitionId: competitionId
        },
        include: {
          game: true
        },
        orderBy: [
          { createdAt: 'desc' }
        ]
      })
      
      tips = await addResultsToTips(allTips, competitionId)
    }
    return NextResponse.json(tips)
  } catch (error) {
    console.error('Error in tips GET API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ENHANCED HELPER FUNCTIONS

async function getUserTipsWithResults(userId: string, competitionId: string, gameIds: string[]) {
  try {
    const userTips = await prisma.tip.findMany({
      where: {
        userId,
        competitionId,
        gameId: { in: gameIds }
      },
      include: {
        game: true
      }
    })

    return await addResultsToTips(userTips, competitionId)
  } catch (error) {
    console.error('Error getting user tips with results:', error)
    return []
  }
}

async function addResultsToTips(tips: any[], competitionId: string) {
  const tipsWithResults = []

  for (const tip of tips) {
    const game = tip.game
    const tipWithResults = {
      id: tip.id,
      gameId: tip.gameId,
      predictedWinner: tip.predictedWinner,
      margin: tip.margin,
      confidence: tip.confidence,
      points: 0,
      isCorrect: null as boolean | null, // Fixed: Explicit type
      marginRank: null as number | null, // Fixed: Explicit type
      marginAccuracy: null as number | null, // Fixed: Explicit type
      createdAt: tip.createdAt,
      updatedAt: tip.updatedAt
    }

    // Only calculate results for completed games
    if (game?.isComplete && game.homeScore !== null && game.awayScore !== null) {
      // Determine actual winner
      const actualWinner = game.homeScore > game.awayScore ? game.homeTeamId : game.awayTeamId
      
      // Check if prediction is correct
      tipWithResults.isCorrect = tip.predictedWinner === actualWinner
      
      // Calculate points using scoring system
      try {
        tipWithResults.points = calculateTipPoints(tip, game)
      } catch (error) {
        console.error('Error calculating points:', error)
        tipWithResults.points = tipWithResults.isCorrect ? 1 : 0 // Fallback
      }
      
      // Calculate margin ranking if margins were predicted
      if (tip.margin) {
        const actualMargin = Math.abs(game.homeScore - game.awayScore)
        tipWithResults.marginAccuracy = Math.abs(tip.margin - actualMargin)
        
        // Get margin ranking for this game
        const marginRank = await calculateMarginRankForGame(tip.gameId, competitionId, tip.userId)
        tipWithResults.marginRank = marginRank
      }
    }

    tipsWithResults.push(tipWithResults)
  }

  return tipsWithResults
}

async function calculateMarginRankForGame(gameId: string, competitionId: string, userId: string): Promise<number | null> {
  try {
    // Get the completed game
    const game = await prisma.game.findUnique({
      where: { id: gameId }
    })

    if (!game?.isComplete || game.homeScore === null || game.awayScore === null) {
      return null
    }

    const actualMargin = Math.abs(game.homeScore - game.awayScore)

    // Get all tips for this game with margin predictions
    const tips = await prisma.tip.findMany({
      where: {
        gameId,
        competitionId,
        margin: { not: null }
      }
    })

    if (tips.length === 0) return null

    // Calculate accuracy and rank
    const tipAccuracies = tips.map(tip => ({
      userId: tip.userId,
      accuracy: Math.abs(tip.margin! - actualMargin)
    })).sort((a, b) => a.accuracy - b.accuracy)

    // Find user's ranking (1-based)
    const userRankIndex = tipAccuracies.findIndex(t => t.userId === userId)
    return userRankIndex !== -1 ? userRankIndex + 1 : null
  } catch (error) {
    console.error('Error calculating margin rank:', error)
    return null
  }
}

async function calculateResultsForSavedTips(savedTips: any[], competitionId: string) {
  try {
    // Get unique game IDs from saved tips - Fixed: Convert Set to Array
    const gameIdsSet = new Set(savedTips.map(tip => tip.gameId))
    const gameIds = Array.from(gameIdsSet)
    
    // Check which games are completed and calculate results
    for (const gameId of gameIds) {
      const game = await prisma.game.findUnique({
        where: { id: gameId }
      })
      
      if (game?.isComplete) {
        await updateResultsForGame(gameId, competitionId)
      }
    }
  } catch (error) {
    console.error('Error calculating results for saved tips:', error)
  }
}

async function updateResultsForGame(gameId: string, competitionId: string) {
  try {
    const game = await prisma.game.findUnique({
      where: { id: gameId }
    })

    if (!game?.isComplete || game.homeScore === null || game.awayScore === null) {
      return
    }

    const actualWinner = game.homeScore > game.awayScore ? game.homeTeamId : game.awayTeamId
    const actualMargin = Math.abs(game.homeScore - game.awayScore)

    // Get all tips for this game
    const tips = await prisma.tip.findMany({
      where: { gameId, competitionId }
    })

    // Calculate margin rankings
    const marginTips = tips.filter(tip => tip.margin !== null)
    const marginAccuracies = marginTips.map(tip => ({
      tipId: tip.id,
      userId: tip.userId,
      accuracy: Math.abs(tip.margin! - actualMargin)
    })).sort((a, b) => a.accuracy - b.accuracy)

    // Update each tip with results
    for (const tip of tips) {
      const isCorrect = tip.predictedWinner === actualWinner
      const points = calculateTipPoints(tip, game)
      
      let marginRank: number | null = null
      let marginAccuracy: number | null = null
      
      if (tip.margin !== null) {
        marginAccuracy = Math.abs(tip.margin - actualMargin)
        const rankIndex = marginAccuracies.findIndex(ma => ma.userId === tip.userId)
        marginRank = rankIndex !== -1 ? rankIndex + 1 : null
      }

      await prisma.tip.update({
        where: { id: tip.id },
        data: {
          points,
          isCorrect,
          marginRank,
          marginAccuracy
        }
      })
    }

    console.log(`Updated results for game ${gameId}`)
  } catch (error) {
    console.error('Error updating results for game:', error)
  }
}

async function recalculateAllResults(competitionId: string) {
  try {
    // Get all completed games
    const completedGames = await prisma.game.findMany({
      where: { isComplete: true }
    })

    for (const game of completedGames) {
      await updateResultsForGame(game.id, competitionId)
    }

    console.log(`Recalculated results for ${completedGames.length} completed games`)
  } catch (error) {
    console.error('Error recalculating all results:', error)
    throw error
  }
}