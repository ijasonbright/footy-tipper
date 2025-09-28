import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { squiggleAPI } from '@/lib/squiggle'
import { mockGameService, initializeMockData, type MockGame } from '@/lib/mock-game-service'

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const round = searchParams.get('round')
    const season = searchParams.get('season') || '2025'
    const source = searchParams.get('source') || 'mock' // 'mock' or 'live'
    const action = searchParams.get('action') // For testing actions

    let games: any[] = []
    let currentRound = 1
    const useMockData = source === 'mock'

    if (useMockData) {
      console.log('🧪 Using mock game data for testing')
      
      // Initialize mock data if not already done
      if (!mockGameService.getSeasonGames(parseInt(season)).length) {
        initializeMockData()
      }

      // Handle testing actions (only for mock data)
      if (action) {
        const seasonNum = parseInt(season)
        const roundNum = round ? parseInt(round) : mockGameService.getCurrentRound(seasonNum)
        
        switch (action) {
          case 'complete':
            const completedGames = mockGameService.completeGames(seasonNum, roundNum, 3)
            return NextResponse.json({
              message: `Completed 3 games in Round ${roundNum}`,
              games: completedGames,
              currentRound: mockGameService.getCurrentRound(seasonNum),
              source: 'mock'
            })
          
          case 'reset':
            mockGameService.resetSeason(seasonNum)
            return NextResponse.json({
              message: `Reset all games for ${season} season`,
              currentRound: 1,
              source: 'mock'
            })
          
          case 'simulate':
            const simulatedGames = mockGameService.simulateLiveRound(seasonNum, roundNum)
            return NextResponse.json({
              message: `Simulated live scoring for Round ${roundNum}`,
              games: simulatedGames,
              currentRound: mockGameService.getCurrentRound(seasonNum),
              source: 'mock'
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

      // Convert mock games to API format
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
      source: useMockData ? 'mock' : 'squiggle',
      total: games.length,
      mode: useMockData ? 'testing' : 'live'
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

// POST endpoint for admin actions (only works with mock data)
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, season = 2025, round, gameId, source = 'mock', competitionId } = body

    // Only allow admin actions for mock data
    if (source !== 'mock') {
      return NextResponse.json({ 
        error: 'Admin actions only available for mock data. Switch to testing mode first.' 
      }, { status: 400 })
    }

    const seasonNum = parseInt(season)
    const roundNum = round ? parseInt(round) : mockGameService.getCurrentRound(seasonNum)

    // Initialize mock data if needed
    if (!mockGameService.getSeasonGames(seasonNum).length) {
      initializeMockData()
    }

    switch (action) {
      case 'complete_game':
        if (!gameId) {
          return NextResponse.json({ error: 'Game ID required' }, { status: 400 })
        }
        
        const games = mockGameService.getSeasonGames(seasonNum)
        const gameIndex = games.findIndex(g => g.id === gameId)
        if (gameIndex === -1) {
          return NextResponse.json({ error: 'Game not found' }, { status: 404 })
        }
        
        // Generate realistic score and complete the game
        const homeScore = Math.floor(Math.random() * 60) + 60 // 60-120 points
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
          message: `Completed game: ${games[gameIndex].homeTeam} ${homeScore} - ${awayScore} ${games[gameIndex].awayTeam}`,
          game: games[gameIndex]
        })

      case 'complete_round':
        mockGameService.completeGames(seasonNum, roundNum, 9)
        return NextResponse.json({
          message: `Completed all games in Round ${roundNum}`,
          games: mockGameService.getRoundGames(seasonNum, roundNum),
          currentRound: mockGameService.getCurrentRound(seasonNum)
        })

      case 'reset_season':
        mockGameService.resetSeason(seasonNum)
        return NextResponse.json({
          message: `Reset all games for ${season} season`,
          currentRound: 1
        })

      case 'advance_round':
        // Complete current round and advance to next
        mockGameService.completeGames(seasonNum, roundNum, 9)
        const nextRound = mockGameService.getCurrentRound(seasonNum)
        return NextResponse.json({
          message: `Completed Round ${roundNum}. Advanced to Round ${nextRound}`,
          currentRound: nextRound,
          games: mockGameService.getRoundGames(seasonNum, nextRound)
        })

      case 'simulate_live':
        // Simulate one game finishing during "live" play
        const simulatedGames = mockGameService.simulateLiveRound(seasonNum, roundNum)
        return NextResponse.json({
          message: `Simulated live result in Round ${roundNum}`,
          games: simulatedGames,
          currentRound: mockGameService.getCurrentRound(seasonNum)
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in games POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
