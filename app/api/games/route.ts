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
    const source = searchParams.get('source') || 'mock'
    const action = searchParams.get('action')

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
            await syncMockGamesToDatabase(completedGames)
            // Fetch from DB to get real IDs
            const dbCompletedGames = await prisma.game.findMany({
              where: { season: seasonNum, round: roundNum }
            })
            return NextResponse.json({
              message: `Completed 3 games in Round ${roundNum}`,
              games: dbCompletedGames,
              currentRound: mockGameService.getCurrentRound(seasonNum),
              source: 'mock'
            })
          
          case 'reset':
            mockGameService.resetSeason(seasonNum)
            const resetGames = mockGameService.getSeasonGames(seasonNum)
            await syncMockGamesToDatabase(resetGames)
            return NextResponse.json({
              message: `Reset all games for ${season} season`,
              currentRound: 1,
              source: 'mock'
            })
          
          case 'simulate':
            const simulatedGames = mockGameService.simulateLiveRound(seasonNum, roundNum)
            await syncMockGamesToDatabase(simulatedGames)
            const dbSimulatedGames = await prisma.game.findMany({
              where: { season: seasonNum, round: roundNum }
            })
            return NextResponse.json({
              message: `Simulated live scoring for Round ${roundNum}`,
              games: dbSimulatedGames,
              currentRound: mockGameService.getCurrentRound(seasonNum),
              source: 'mock'
            })
        }
      }

      // Get mock games and sync to database
      currentRound = mockGameService.getCurrentRound(parseInt(season))
      
      const targetRound = round ? parseInt(round) : currentRound
      const mockGames = mockGameService.getRoundGames(parseInt(season), targetRound)
      
      // Sync mock games to database
      await syncMockGamesToDatabase(mockGames)

      // ✅ CRITICAL FIX: Fetch games FROM DATABASE to get real IDs
      games = await prisma.game.findMany({
        where: {
          season: parseInt(season),
          round: targetRound
        },
        orderBy: [
          { date: 'asc' }
        ]
      })

      console.log(`✅ Returning ${games.length} games from database with real IDs`)

    } else {
      console.log('🏈 Using live Squiggle API data')
      
      try {
        currentRound = await squiggleAPI.getCurrentRound(parseInt(season))
        
        const targetRound = round ? parseInt(round) : currentRound
        const squiggleGames = await squiggleAPI.getGames(parseInt(season), targetRound)
        
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

        await syncGamesToDatabase(games)
        
      } catch (error) {
        console.error('Error fetching from Squiggle API:', error)
        
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
        currentRound = 1
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

async function syncMockGamesToDatabase(games: any[]) {
  try {
    for (const game of games) {
      await prisma.game.upsert({
        where: {
          squiggleId: game.squiggleId
        },
        update: {
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          homeTeamId: game.homeTeamId,
          awayTeamId: game.awayTeamId,
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
    console.log(`✅ Synced ${games.length} mock games to database`)
  } catch (error) {
    console.error('Error syncing mock games to database:', error)
  }
}

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

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, season = 2025, round, gameId, source = 'mock', competitionId } = body

    if (source !== 'mock') {
      return NextResponse.json({ 
        error: 'Admin actions only available for mock data. Switch to testing mode first.' 
      }, { status: 400 })
    }

    const seasonNum = parseInt(season)
    const roundNum = round ? parseInt(round) : mockGameService.getCurrentRound(seasonNum)

    if (!mockGameService.getSeasonGames(seasonNum).length) {
      initializeMockData()
    }

    switch (action) {
      case 'complete_game':
        if (!gameId) {
          return NextResponse.json({ error: 'Game ID required' }, { status: 400 })
        }
        
        // Find game in database by ID
        const dbGame = await prisma.game.findUnique({
          where: { id: gameId }
        })

        if (!dbGame) {
          return NextResponse.json({ error: 'Game not found' }, { status: 404 })
        }

        // Generate scores
        const homeScore = Math.floor(Math.random() * 60) + 60
        const awayScore = Math.floor(Math.random() * 60) + 60
        const winner = homeScore > awayScore ? dbGame.homeTeamId : dbGame.awayTeamId

        // Update in database
        const updatedGame = await prisma.game.update({
          where: { id: gameId },
          data: {
            homeScore,
            awayScore,
            winner,
            isComplete: true,
            updatedAt: new Date()
          }
        })

        console.log(`✅ Completed game: ${updatedGame.homeTeam} ${homeScore} - ${awayScore} ${updatedGame.awayTeam}`)
        
        return NextResponse.json({
          message: `Completed game: ${updatedGame.homeTeam} ${homeScore} - ${awayScore} ${updatedGame.awayTeam}`,
          game: updatedGame
        })

      case 'complete_round':
        // Get all incomplete games for this round from database
        const roundGames = await prisma.game.findMany({
          where: {
            season: seasonNum,
            round: roundNum,
            isComplete: false
          }
        })

        // Complete each game
        for (const game of roundGames) {
          const hScore = Math.floor(Math.random() * 60) + 60
          const aScore = Math.floor(Math.random() * 60) + 60
          
          await prisma.game.update({
            where: { id: game.id },
            data: {
              homeScore: hScore,
              awayScore: aScore,
              winner: hScore > aScore ? game.homeTeamId : game.awayTeamId,
              isComplete: true,
              updatedAt: new Date()
            }
          })
        }

        // Fetch all games for this round (including completed ones) to return
        const allRoundGames = await prisma.game.findMany({
          where: {
            season: seasonNum,
            round: roundNum
          },
          orderBy: [
            { date: 'asc' }
          ]
        })

        console.log(`✅ Completed ${roundGames.length} games in Round ${roundNum}`)

        return NextResponse.json({
          message: `Completed ${roundGames.length} games in Round ${roundNum}`,
          games: allRoundGames,
          completedCount: roundGames.length,
          currentRound: mockGameService.getCurrentRound(seasonNum)
        })

      case 'reset_season':
        // Reset all games in database
        await prisma.game.updateMany({
          where: { season: seasonNum },
          data: {
            homeScore: null,
            awayScore: null,
            winner: null,
            isComplete: false
          }
        })

        return NextResponse.json({
          message: `Reset all games for ${season} season`,
          currentRound: 1
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in games POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}