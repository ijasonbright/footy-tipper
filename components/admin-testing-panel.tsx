'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  AlertCircle,
  Trophy,
  Play
} from 'lucide-react'

interface Game {
  id: string
  round: number
  homeTeam: string
  awayTeam: string
  homeTeamId: number
  awayTeamId: number
  homeScore: number | null
  awayScore: number | null
  isComplete: boolean
  winner: number | null
  date: string
}

export function AdminTestingPanel({ competitionId }: { competitionId: string }) {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [currentRound, setCurrentRound] = useState(1)

  useEffect(() => {
    loadGames()
  }, [currentRound])

  const loadGames = async () => {
    setLoading(true)
    try {
      // Load mock games for the current round
      const response = await fetch(`/api/games?round=${currentRound}&source=mock`)
      const data = await response.json()
      
      if (data.games) {
        setGames(data.games)
      }
    } catch (error) {
      console.error('Error loading games:', error)
    }
    setLoading(false)
  }

  const completeGame = async (gameId: string, homeScore: number, awayScore: number) => {
    setProcessing(gameId)
    try {
      const response = await fetch(`/api/games/${gameId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homeScore, awayScore })
      })

      if (response.ok) {
        await loadGames()
        alert('Game completed! Check the leaderboard to see updated scores.')
      } else {
        const error = await response.json()
        alert(`Failed to complete game: ${error.error}`)
      }
    } catch (error) {
      console.error('Error completing game:', error)
      alert('Error completing game')
    }
    setProcessing(null)
  }

  const completeAllGames = async () => {
    const incompleteGames = games.filter(g => !g.isComplete)
    
    if (incompleteGames.length === 0) {
      alert('All games in this round are already complete!')
      return
    }

    const confirmed = confirm(`Complete all ${incompleteGames.length} games in Round ${currentRound}?`)
    if (!confirmed) return

    setProcessing('all')
    
    for (const game of incompleteGames) {
      // Generate random realistic AFL scores
      const homeScore = Math.floor(Math.random() * 40) + 70  // 70-110
      const awayScore = Math.floor(Math.random() * 40) + 70  // 70-110
      
      await completeGame(game.id, homeScore, awayScore)
      
      // Small delay between games
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    setProcessing(null)
    alert(`Completed all ${incompleteGames.length} games in Round ${currentRound}!`)
  }

  const resetRound = async () => {
    const confirmed = confirm(`Reset all games in Round ${currentRound} to incomplete?`)
    if (!confirmed) return

    setProcessing('reset')
    
    for (const game of games.filter(g => g.isComplete)) {
      try {
        await fetch(`/api/games/${game.id}/reset`, {
          method: 'POST'
        })
      } catch (error) {
        console.error('Error resetting game:', error)
      }
    }

    setProcessing(null)
    await loadGames()
    alert('Round reset!')
  }

  if (loading) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="animate-pulse">Loading admin panel...</div>
      </div>
    )
  }

  const completedCount = games.filter(g => g.isComplete).length
  const totalCount = games.length

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-600" />
          <h3 className="text-lg font-semibold text-yellow-900">
            Admin Testing Panel - Round {currentRound}
          </h3>
        </div>
        <div className="text-sm text-yellow-700">
          {completedCount}/{totalCount} games complete
        </div>
      </div>

      {/* Round Selector */}
      <div className="flex gap-2 mb-4">
        {[1, 2, 3, 4, 5].map(round => (
          <Button
            key={round}
            onClick={() => setCurrentRound(round)}
            variant={currentRound === round ? 'default' : 'outline'}
            size="sm"
          >
            R{round}
          </Button>
        ))}
      </div>

      {/* Bulk Actions */}
      <div className="flex gap-2 mb-4">
        <Button
          onClick={completeAllGames}
          disabled={processing !== null || completedCount === totalCount}
          className="bg-green-600 hover:bg-green-700"
          size="sm"
        >
          <Play className="w-4 h-4 mr-2" />
          Complete All Games
        </Button>
        <Button
          onClick={resetRound}
          disabled={processing !== null || completedCount === 0}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset Round
        </Button>
        <Button
          onClick={loadGames}
          disabled={processing !== null}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Games List */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-yellow-800 mb-2">
          Round {currentRound} Games:
        </h4>
        {games.slice(0, 9).map((game) => (
          <div 
            key={game.id} 
            className="flex items-center justify-between p-3 bg-white border border-yellow-200 rounded"
          >
            <div className="flex-1">
              <div className="font-medium text-sm">
                {game.homeTeam} vs {game.awayTeam}
              </div>
              {game.isComplete ? (
                <div className="flex items-center gap-2 text-sm text-green-600 mt-1">
                  <CheckCircle className="w-4 h-4" />
                  Complete: {game.homeScore} - {game.awayScore}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <Clock className="w-4 h-4" />
                  Not complete
                </div>
              )}
            </div>

            {!game.isComplete && (
              <div className="flex gap-2">
                <Button
                  onClick={() => completeGame(game.id, 95, 82)}
                  disabled={processing !== null}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  95-82
                </Button>
                <Button
                  onClick={() => completeGame(game.id, 101, 78)}
                  disabled={processing !== null}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                >
                  101-78
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-blue-800">
            <strong>How to use:</strong>
            <ul className="mt-1 space-y-1 text-xs">
              <li>Click score buttons to complete individual games</li>
              <li>Use "Complete All Games" to finish the entire round</li>
              <li>Check the Leaderboard tab to see calculated scores</li>
              <li>Use "Reset Round" to start over</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}