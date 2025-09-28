import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { squiggleAPI } from '@/lib/squiggle'
import { mockGameService, initializeMockData, type MockGame } from '@/lib/mock-game-service'

// Environment flag to toggle between live and mock data
const USE_MOCK_DATA = process.env.NODE_ENV === 'development' || process.env.USE_MOCK_GAMES === 'true'

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const round = searchParams.get('round')
    const season = searchParams.get('season') || '2025'
    const action = searchParams.get('action') // For testing actions like 'complete', 'reset', 'simulate'

    let games: any[] = []
    let currentRound = 1

    if (USE_MOCK_DATA) {
      console.log('🧪 Using mock game data for testing')
      
      // Initialize mock data if not already done
      if (!mockGameService.getSeasonGames(parseInt(season)).length) {
        initializeMockData()
      }

      // Handle testing actions
      if (action) {
        const seasonNum = parseInt(season)
        const roundNum = round ? parseInt(round) : mockGameService.getCurrentRound(seasonNum)
        
        switch (action) {
          case 'complete':
            // Complete some games in the specified round
            const completedGames = mockGameService.completeGames(seasonNum, roundNum, 3)
            return NextResponse.json({
              message: `Completed 3 games in Round ${roundNum}`,
              games: completedGames,
              currentRound: mockGameService.getCurrentRound(seasonNum)
            })
          
          case 'reset':
            // Reset all games to incomplete
            mockGameService.resetSeason(seasonNum)
            return NextResponse.json({
              message: `Reset all games for ${season} season`,
              currentRound: 1
            })
          
          case 'simulate':
            // Simulate live scoring for the current round
            const simulatedGames = mockGameService.simulateLiveRound(seasonNum, roundNum)
            return NextResponse.json({
              message: `Simulated live scoring for Round ${roundNum}`,
              games: simulatedGames,
              currentRound: mockGameService.getCurrentRound(seasonNum)
            })
        }
      }

      // Get mock games
      currentRound = mockGameService.getCurrentRound(parseInt(season))
      
      if (round) {
        games = mockGameService.getRoundGames(parseInt(season), parseInt(round))
      } else {
        games = mockGameService.getRoundGames(parseInt(season), currentRound)
      }

      // Convert mock games to database format
      games = games.map(game => ({
        id: game.id,
        squiggleId: game.squiggleId,
        round: game.round,
        season: game.season,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        homeTeamId: game.homeTeamId,
        awayTeamId: game.awayTeamId,
        venue: game.venue,
        date: game.date,
        homeScore: game.homeScore,
        awayScore: game.awayScore,
        winner: game.winner,
        isComplete: game.isComplete,
        createdAt: game.createdAt,
        updatedAt: game.updatedAt
      }))

    } else {
      console.log('🏈 Using live Squiggle API data')
      
      try {
        // Get live data from Squiggle API
        currentRound = await squiggleAPI.getCurrentRound(parseInt(season))
        
        const targetRound = round ? parseInt(round) : currentRound
        const squiggleGames = await squiggleAPI.getGames(parseInt(season), targetRound)
        
        // Convert Squiggle format to our database format
        games = squiggleGames.map(game => ({
          id: `squiggle-${game.id}`,
          squiggleId: game.id.toString(),
          round: game.round,
          season: game.year,
          homeTeam: game.hteam,
          awayTeam: game.ateam,
          homeTeamId: game.hteamid,
          awayTeamId: game.ateamid,
          venue: game.venue,
          date: new Date(game.date),
          homeScore: game.hscore || null,
          awayScore: game.ascore || null,
          winner: game.winner || null,
          isComplete: game.complete === 1,
          createdAt: new Date(),
          updatedAt: new Date()
        }))

        // Sync games to database for persistent storage
        await syncGamesToDatabase(games)
        
      } catch (error) {
        console.error('Error fetching from Squiggle API:', error)
        
        // Fallback to database games if API fails
        console.log('📦 Falling back to cached database games')
        const dbGames = await prisma.game.findMany({
          where: {
            season: parseInt(season),
            ...(round && { round: parseInt(round) })
          },
          orderBy: [
            { round: 'asc' },
            { date: 'asc' }
          ]
        })

        games = dbGames
        currentRound = 1 // Default if we can't determine current round
      }
    }

    return NextResponse.json({
      games,
      currentRound,
      season: parseInt(season),
      round: round ? parseInt(round) : currentRound,
      source: USE_MOCK_DATA ? 'mock' : 'squiggle',
      total: games.length
    })

  } catch (error) {
    console.error('Error in games API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Sync games from Squiggle API to database
async function syncGamesToDatabase(games: any[]) {
  try {
    for (const game of games) {
      await prisma.game.upsert({
        where: {
          squiggleId: game.squiggleId
        },
        update: {
          homeScore: game.homeScore,
          awayScore: game.awayScore,
          winner: game.winner,
          isComplete: game.isComplete,
          updatedAt: new Date()
        },
        create: {
          squiggleId: game.squiggleId,
          round: game.round,
          season: game.season,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          homeTeamId: game.homeTeamId,
          awayTeamId: game.awayTeamId,
          venue: game.venue,
          date: game.date,
          homeScore: game.homeScore,
          awayScore: game.awayScore,
          winner: game.winner,
          isComplete: game.isComplete
        }
      })
    }
    console.log(`✅ Synced ${games.length} games to database`)
  } catch (error) {
    console.error('Error syncing games to database:', error)
  }
}

// POST endpoint for admin actions (complete games, reset season, etc.)
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, season = 2025, round, gameId } = body

    if (!USE_MOCK_DATA) {
      return NextResponse.json({ 
        error: 'Admin actions only available in mock mode' 
      }, { status: 400 })
    }

    const seasonNum = parseInt(season)
    const roundNum = round ? parseInt(round) : mockGameService.getCurrentRound(seasonNum)

    switch (action) {
      case 'complete_game':
        if (!gameId) {
          return NextResponse.json({ error: 'Game ID required' }, { status: 400 })
        }
        // Complete a specific game
        const games = mockGameService.getSeasonGames(seasonNum)
        const gameIndex = games.findIndex(g => g.id === gameId)
        if (gameIndex === -1) {
          return NextResponse.json({ error: 'Game not found' }, { status: 404 })
        }
        
        // Generate score and complete the game
        const homeScore = Math.floor(Math.random() * 60) + 60
        const awayScore = Math.floor(Math.random() * 60) + 60
        
        games[gameIndex] = {
          ...games[gameIndex],
          homeScore,
          awayScore,
          winner: homeScore > awayScore ? games[gameIndex].homeTeamId : games[gameIndex].awayTeamId,
          isComplete: true,
          updatedAt: new Date()
        }
        
        return NextResponse.json({
          message: `Completed game: ${games[gameIndex].homeTeam} vs ${games[gameIndex].awayTeam}`,
          game: games[gameIndex]
        })

      case 'complete_round':
        mockGameService.completeGames(seasonNum, roundNum, 9)
        return NextResponse.json({
          message: `Completed all games in Round ${roundNum}`,
          games: mockGameService.getRoundGames(seasonNum, roundNum)
        })

      case 'reset_season':
        mockGameService.resetSeason(seasonNum)
        return NextResponse.json({
          message: `Reset all games for ${season} season`
        })

      case 'advance_round':
        // Complete current round and advance to next
        mockGameService.completeGames(seasonNum, roundNum, 9)
        const nextRound = mockGameService.getCurrentRound(seasonNum)
        return NextResponse.json({
          message: `Advanced to Round ${nextRound}`,
          currentRound: nextRound,
          games: mockGameService.getRoundGames(seasonNum, nextRound)
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in games POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
