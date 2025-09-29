'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Play, 
  RotateCcw, 
  FastForward, 
  Trophy,
  CheckCircle,
  Clock,
  RefreshCw,
  Database,
  TestTube,
  Settings,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'

interface Game {
  id: string
  round: number
  homeTeam: string
  awayTeam: string
  homeScore: number | null
  awayScore: number | null
  isComplete: boolean
  date: string
}

interface GameResponse {
  games: Game[]
  currentRound: number
  season: number
  source: string
  total: number
}

interface AdminTestingPanelProps {
  competitionId?: string // Optional: for competition-specific settings
}

export function AdminTestingPanel({ competitionId }: AdminTestingPanelProps) {
  const [games, setGames] = useState<Game[]>([])
  const [currentRound, setCurrentRound] = useState(1)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [useMockData, setUseMockData] = useState(true) // Default to mock for testing
  const [dataSource, setDataSource] = useState<'mock' | 'squiggle'>('mock')

  // Load current round games
  const loadGames = async (round?: number) => {
    setLoading(true)
    try {
      const url = new URL('/api/games', window.location.origin)
      if (round) url.searchParams.set('round', round.toString())
      url.searchParams.set('source', useMockData ? 'mock' : 'live')
      
      const response = await fetch(url.toString())
      const data: GameResponse = await response.json()
      
      if (response.ok) {
        setGames(data.games)
        setCurrentRound(data.currentRound)
        setDataSource(data.source as 'mock' | 'squiggle')
        setMessage(`Loaded ${data.games.length} games from ${data.source} data`)
      } else {
        setMessage('Error loading games')
      }
    } catch (error) {
      setMessage('Failed to load games')
    }
    setLoading(false)
  }

  // Execute admin action
  const executeAction = async (action: string, gameId?: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action, 
          season: 2025, 
          round: currentRound,
          source: useMockData ? 'mock' : 'live',
          ...(gameId && { gameId }),
          ...(competitionId && { competitionId })
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setMessage(data.message)
        await loadGames(currentRound) // Reload games
      } else {
        setMessage(data.error || 'Action failed')
      }
    } catch (error) {
      setMessage('Failed to execute action')
    }
    setLoading(false)
  }

  // Toggle data source
  const toggleDataSource = async () => {
    setUseMockData(!useMockData)
    setMessage('Switching data source...')
    // Reload games with new source after a short delay
    setTimeout(() => {
      loadGames(currentRound)
    }, 500)
  }

  // Load games on component mount and when data source changes
  useEffect(() => {
    loadGames()
  }, [useMockData])

  const completedGames = games.filter(g => g.isComplete).length
  const totalGames = games.length

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-500" />
            Admin Panel - Round {currentRound}
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Manage game data and test tipping functionality
          </p>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            {completedGames}/{totalGames}
          </div>
          <div className="text-sm text-gray-500">Games Complete</div>
        </div>
      </div>

      {/* Data Source Toggle */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {dataSource === 'mock' ? (
                <TestTube className="w-5 h-5 text-orange-500" />
              ) : (
                <Database className="w-5 h-5 text-blue-500" />
              )}
              <span className="font-medium text-gray-900">
                Data Source: {dataSource === 'mock' ? 'Mock Testing Data' : 'Live Squiggle API'}
              </span>
            </div>
            
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              dataSource === 'mock' 
                ? 'bg-orange-100 text-orange-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              {dataSource === 'mock' ? 'TESTING' : 'LIVE'}
            </span>
          </div>

          <button
            onClick={toggleDataSource}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            {useMockData ? (
              <>
                <ToggleRight className="w-5 h-5 text-orange-500" />
                <span className="text-sm">Switch to Live Data</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-5 h-5 text-blue-500" />
                <span className="text-sm">Switch to Mock Data</span>
              </>
            )}
          </button>
        </div>
        
        <p className="text-sm text-gray-600 mt-2">
          {useMockData 
            ? '🧪 Using mock data for testing. You can complete games and advance rounds.'
            : '🏈 Using live AFL data from Squiggle API. Data is read-only.'
          }
        </p>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`mb-4 p-3 rounded-md ${
          message.includes('Error') || message.includes('Failed')
            ? 'bg-red-50 border border-red-200 text-red-800'
            : 'bg-blue-50 border border-blue-200 text-blue-800'
        }`}>
          <p className="text-sm">{message}</p>
        </div>
      )}

      {/* Action Buttons - Only show for mock data */}
      {useMockData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Button
            onClick={() => loadGames()}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            onClick={() => executeAction('complete_round')}
            disabled={loading}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4" />
            Complete Round
          </Button>

          <Button
            onClick={() => executeAction('advance_round')}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <FastForward className="w-4 h-4" />
            Advance Round
          </Button>

          <Button
            onClick={() => executeAction('reset_season')}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Season
          </Button>
        </div>
      )}

      {/* Refresh Button for Live Data */}
      {!useMockData && (
        <div className="mb-6">
          <Button
            onClick={() => loadGames()}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Live Data
          </Button>
        </div>
      )}

      {/* Round Navigation */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm font-medium text-gray-700">Round:</span>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(round => (
          <Button
            key={round}
            onClick={() => loadGames(round)}
            disabled={loading}
            variant={round === currentRound ? "default" : "outline"}
            size="sm"
          >
            {round}
          </Button>
        ))}
      </div>

      {/* Games List */}
      <div className="space-y-2">
        <h3 className="font-medium text-gray-900 mb-3">Round {currentRound} Games</h3>
        {games.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No games loaded</p>
            <p className="text-xs mt-1">
              {useMockData ? 'Try generating mock data' : 'Check if live data is available'}
            </p>
          </div>
        ) : (
          games.map((game) => (
            <div
              key={game.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                game.isComplete
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {game.homeTeam} vs {game.awayTeam}
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(game.date).toLocaleDateString('en-AU', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {game.isComplete ? (
                  <div className="text-right">
                    <div className="font-bold text-gray-900">
                      {game.homeScore} - {game.awayScore}
                    </div>
                    <div className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Complete
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {useMockData ? 'Ready to tip' : 'Upcoming'}
                    </div>
                    {useMockData && (
                      <Button
                        onClick={() => executeAction('complete_game', game.id)}
                        disabled={loading}
                        size="sm"
                        variant="outline"
                        className="text-xs"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Complete
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">
          {useMockData ? 'Testing Mode Instructions:' : 'Live Mode Instructions:'}
        </h4>
        {useMockData ? (
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>Complete Round:</strong> Mark all games in current round as finished</li>
            <li>• <strong>Advance Round:</strong> Complete current round and move to next</li>
            <li>• <strong>Reset Season:</strong> Set all games back to incomplete</li>
            <li>• <strong>Complete Game:</strong> Finish individual games with random scores</li>
            <li>• <strong>Switch to Live:</strong> Use real AFL data when season is active</li>
          </ul>
        ) : (
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>Read-only mode:</strong> Data comes from live Squiggle AFL API</li>
            <li>• <strong>Auto-updates:</strong> Scores update automatically when games finish</li>
            <li>• <strong>Current season:</strong> Shows real AFL fixtures and results</li>
            <li>• <strong>Switch to Testing:</strong> Use mock data for development and testing</li>
          </ul>
        )}
      </div>
    </div>
  )
}
