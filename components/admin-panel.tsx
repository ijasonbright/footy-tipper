'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Settings, 
  RefreshCw, 
  CheckCircle,
  Users,
  Calendar,
  RotateCcw,
  SkipForward,
  Play
} from 'lucide-react'

interface AdminPanelProps {
  competitionId: string
  isAdmin: boolean
}

export function AdminPanel({ competitionId, isAdmin }: AdminPanelProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [currentRound, setCurrentRound] = useState(1)
  const [gameStats, setGameStats] = useState({ loaded: 0, total: 0 })

  if (!isAdmin) {
    return null // Don't show admin panel to regular users
  }

  // Admin Functions
  const refreshGames = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/refresh-games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitionId })
      })
      
      if (response.ok) {
        setMessage('✅ Games refreshed successfully')
      } else {
        setMessage('❌ Failed to refresh games')
      }
    } catch (error) {
      setMessage('❌ Error refreshing games')
    }
    setLoading(false)
    setTimeout(() => setMessage(''), 3000)
  }

  const completeRound = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/complete-round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitionId, round: currentRound })
      })
      
      if (response.ok) {
        setMessage('✅ Round completed successfully')
      } else {
        setMessage('❌ Failed to complete round')
      }
    } catch (error) {
      setMessage('❌ Error completing round')
    }
    setLoading(false)
    setTimeout(() => setMessage(''), 3000)
  }

  const advanceRound = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/advance-round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitionId })
      })
      
      if (response.ok) {
        setMessage('✅ Advanced to next round')
        setCurrentRound(prev => prev + 1)
      } else {
        setMessage('❌ Failed to advance round')
      }
    } catch (error) {
      setMessage('❌ Error advancing round')
    }
    setLoading(false)
    setTimeout(() => setMessage(''), 3000)
  }

  const resetSeason = async () => {
    if (!confirm('Are you sure you want to reset the entire season? This cannot be undone.')) {
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch('/api/admin/reset-season', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitionId })
      })
      
      if (response.ok) {
        setMessage('✅ Season reset successfully')
        setCurrentRound(1)
      } else {
        setMessage('❌ Failed to reset season')
      }
    } catch (error) {
      setMessage('❌ Error resetting season')
    }
    setLoading(false)
    setTimeout(() => setMessage(''), 3000)
  }

  const switchToLive = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/switch-to-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitionId })
      })
      
      if (response.ok) {
        setMessage('✅ Switched to live AFL data')
      } else {
        setMessage('❌ Failed to switch to live data')
      }
    } catch (error) {
      setMessage('❌ Error switching to live data')
    }
    setLoading(false)
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <div className="bg-gray-50 border-b border-gray-200 p-4 mb-4">
      <div className="max-w-4xl mx-auto">
        {/* Admin Header */}
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Admin Panel - Round {currentRound}
          </h2>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
            {gameStats.loaded}/{gameStats.total} Games Complete
          </span>
        </div>

        <div className="text-sm text-gray-600 mb-4">
          Manage game data and test tipping functionality
        </div>

        {/* Data Source Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Data Source:</h3>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                  🧪 Mock Testing Data
                </span>
                <span className="text-sm text-gray-600">
                  Using mock data for testing. You can complete games and advance rounds.
                </span>
              </div>
            </div>
            <Button
              onClick={switchToLive}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Switch to Live Data
            </Button>
          </div>
        </div>

        {/* Game Status */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-3 mb-4">
          <p className="text-sm text-blue-800">
            📊 Loaded {gameStats.loaded} games from mock data
          </p>
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <Button
            onClick={refreshGames}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            onClick={completeRound}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Complete Round
          </Button>

          <Button
            onClick={advanceRound}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          >
            <SkipForward className="w-4 h-4" />
            Advance Round
          </Button>

          <Button
            onClick={resetSeason}
            disabled={loading}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50 flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Season
          </Button>
        </div>

        {/* Test Mode Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <h4 className="font-medium text-yellow-800 mb-2">Test Mode Instructions:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• <strong>Complete Round:</strong> Mark all games in current round as finished</li>
            <li>• <strong>Advance Round:</strong> Complete current round and move to next</li>
            <li>• <strong>Reset Season:</strong> Set all games back to incomplete</li>
            <li>• <strong>Complete Game:</strong> Finish individual games with mock scores</li>
            <li>• <strong>Switch to Live:</strong> Use real AFL data when season starts</li>
          </ul>
        </div>

        {/* Round Selection */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-medium text-gray-900 mb-3">Round:</h4>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 8 }, (_, i) => i + 1).map(round => (
              <Button
                key={round}
                onClick={() => setCurrentRound(round)}
                variant={round === currentRound ? "default" : "outline"}
                size="sm"
                className="w-10 h-8"
              >
                {round}
              </Button>
            ))}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            message.includes('❌') 
              ? 'bg-red-50 border border-red-200 text-red-800'
              : 'bg-green-50 border border-green-200 text-green-800'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  )
}