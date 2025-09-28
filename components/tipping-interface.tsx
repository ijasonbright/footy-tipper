'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Target, 
  Trophy, 
  Clock, 
  Save, 
  CheckCircle,
  AlertTriangle,
  Calendar,
  Users,
  TrendingUp,
  Star,
  Shield,
  Zap
} from 'lucide-react'
import { getTeamColors, getTeamLogo, getTeamForm, getTeamFormRecord, getTeamById } from '@/lib/mock-game-service'

interface Game {
  id: string
  round: number
  homeTeam: string
  awayTeam: string
  homeTeamId: number
  awayTeamId: number
  venue: string
  date: string
  homeScore: number | null
  awayScore: number | null
  isComplete: boolean
}

interface UserTip {
  id?: string
  gameId: string
  predictedWinner: number
  margin?: number
  confidence?: number
}

interface TippingInterfaceProps {
  competitionId: string
  userId: string
  competitionSettings: {
    allowConfidence?: boolean
    allowMargin?: boolean
    scoringSystem?: string
  }
}

export function TippingInterface({ 
  competitionId, 
  userId, 
  competitionSettings = {} 
}: TippingInterfaceProps) {
  const [games, setGames] = useState<Game[]>([])
  const [userTips, setUserTips] = useState<Map<string, UserTip>>(new Map())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentRound, setCurrentRound] = useState(1)
  const [message, setMessage] = useState('')
  const [dataSource, setDataSource] = useState<'mock' | 'live'>('mock')

  const { allowConfidence = false, allowMargin = false, scoringSystem = 'standard' } = competitionSettings

  // Load games for current round
  const loadGames = async (round?: number) => {
    setLoading(true)
    try {
      const url = new URL('/api/games', window.location.origin)
      if (round) url.searchParams.set('round', round.toString())
      url.searchParams.set('source', 'mock') // Default to mock for testing
      
      const response = await fetch(url.toString())
      const data = await response.json()
      
      if (response.ok) {
        setGames(data.games)
        setCurrentRound(data.currentRound)
        setDataSource(data.source)
        setMessage('')
        
        // Load existing tips for these games
        await loadUserTips(data.games.map((g: Game) => g.id))
      } else {
        setMessage('Error loading games')
      }
    } catch (error) {
      setMessage('Failed to load games')
    }
    setLoading(false)
  }

  // Load user's existing tips
  const loadUserTips = async (gameIds: string[]) => {
    try {
      const response = await fetch('/api/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get',
          competitionId,
          gameIds
        })
      })
      
      if (response.ok) {
        const tips = await response.json()
        const tipsMap = new Map<string, UserTip>()
        
        tips.forEach((tip: any) => {
          tipsMap.set(tip.gameId, {
            id: tip.id,
            gameId: tip.gameId,
            predictedWinner: tip.predictedWinner,
            margin: tip.margin,
            confidence: tip.confidence
          })
        })
        
        setUserTips(tipsMap)
      }
    } catch (error) {
      console.error('Error loading user tips:', error)
    }
  }

  // Update a tip
  const updateTip = (gameId: string, updates: Partial<UserTip>) => {
    setUserTips(prev => {
      const newTips = new Map(prev)
      const existingTip = newTips.get(gameId) || { gameId, predictedWinner: 0 }
      newTips.set(gameId, { ...existingTip, ...updates })
      return newTips
    })
  }

  // Save all tips
  const saveTips = async () => {
    setSaving(true)
    try {
      const tipsToSave = Array.from(userTips.values()).filter(tip => 
        tip.predictedWinner > 0 // Only save tips with a team selected
      )

      const response = await fetch('/api/tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          competitionId,
          tips: tipsToSave
        })
      })
      
      if (response.ok) {
        setMessage(`✅ Saved ${tipsToSave.length} tips successfully!`)
        setTimeout(() => setMessage(''), 3000)
      } else {
        const error = await response.json()
        setMessage(`❌ Error saving tips: ${error.message}`)
      }
    } catch (error) {
      setMessage('❌ Failed to save tips')
    }
    setSaving(false)
  }

  // Check if game tipping is locked (past deadline)
  const isGameLocked = (game: Game) => {
    const gameTime = new Date(game.date)
    const now = new Date()
    
    // For testing: Only lock if game is already complete
    // In live mode, this would check if game time has passed
    return game.isComplete
  }

  // Get confidence rankings
  const getConfidenceRankings = () => {
    const tipsWithConfidence = Array.from(userTips.values())
      .filter(tip => tip.confidence && tip.confidence > 0)
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
    
    return tipsWithConfidence
  }

  // Auto-assign confidence points (highest to lowest by order)
  const autoAssignConfidence = () => {
    const activeTips = Array.from(userTips.values()).filter(tip => tip.predictedWinner > 0)
    
    activeTips.forEach((tip, index) => {
      updateTip(tip.gameId, { confidence: activeTips.length - index })
    })
    
    setMessage(`🎯 Auto-assigned confidence points (${activeTips.length} tips)`)
    setTimeout(() => setMessage(''), 3000)
  }

  useEffect(() => {
    loadGames()
  }, [])

  const completedTips = Array.from(userTips.values()).filter(tip => tip.predictedWinner > 0).length
  const totalGames = games.filter(g => !g.isComplete).length
  const hasUnsavedChanges = userTips.size > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Target className="w-6 h-6 text-blue-500" />
              Round {currentRound} Tipping
            </h3>
            <p className="text-gray-600 mt-1">
              Make your predictions for Round {currentRound} games
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {completedTips}/{totalGames}
            </div>
            <div className="text-sm text-gray-500">Tips Complete</div>
          </div>
        </div>

        {/* Status and Actions */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              dataSource === 'mock' 
                ? 'bg-orange-100 text-orange-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              {dataSource === 'mock' ? '🧪 Testing Mode' : '🏈 Live Mode'}
            </span>
            
            {completedTips === totalGames && totalGames > 0 && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                All Tips Complete
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {allowConfidence && (
              <Button
                onClick={autoAssignConfidence}
                disabled={completedTips === 0}
                variant="outline"
                size="sm"
              >
                <Star className="w-4 h-4 mr-1" />
                Auto Confidence
              </Button>
            )}
            
            <Button
              onClick={saveTips}
              disabled={saving || completedTips === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Tips ({completedTips})
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mt-3 p-3 rounded-md ${
            message.includes('❌') 
              ? 'bg-red-50 border border-red-200 text-red-800'
              : message.includes('✅') || message.includes('🎯')
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-blue-50 border border-blue-200 text-blue-800'
          }`}>
            <p className="text-sm">{message}</p>
          </div>
        )}
      </div>

      {/* Round Navigation */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Round:</span>
        {[1, 2, 3, 4, 5].map(round => (
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
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading games...</p>
          </div>
        ) : games.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No games available for Round {currentRound}</p>
          </div>
        ) : (
          games.map((game) => (
            <GameTippingCard
              key={game.id}
              game={game}
              userTip={userTips.get(game.id)}
              onUpdateTip={(updates) => updateTip(game.id, updates)}
              isLocked={isGameLocked(game)}
              allowConfidence={allowConfidence}
              allowMargin={allowMargin}
              competitionSettings={competitionSettings}
            />
          ))
        )}
      </div>

      {/* Confidence Summary */}
      {allowConfidence && completedTips > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            Confidence Rankings
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {getConfidenceRankings().map((tip, index) => {
              const game = games.find(g => g.id === tip.gameId)
              if (!game) return null
              
              return (
                <div key={tip.gameId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-bold text-sm">
                    {tip.confidence}
                  </div>
                  <div className="flex-1 text-sm">
                    <div className="font-medium text-gray-900">
                      {tip.predictedWinner === game.homeTeamId ? game.homeTeam : game.awayTeam}
                    </div>
                    <div className="text-gray-500">
                      {game.homeTeam} vs {game.awayTeam}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Individual game tipping card component with enhanced visuals
interface GameTippingCardProps {
  game: Game
  userTip?: UserTip
  onUpdateTip: (updates: Partial<UserTip>) => void
  isLocked: boolean
  allowConfidence: boolean
  allowMargin: boolean
  competitionSettings: any
}

function GameTippingCard({ 
  game, 
  userTip, 
  onUpdateTip, 
  isLocked,
  allowConfidence,
  allowMargin 
}: GameTippingCardProps) {
  const homeTeam = getTeamById(game.homeTeamId)
  const awayTeam = getTeamById(game.awayTeamId)
  const homeColors = getTeamColors(game.homeTeam)
  const awayColors = getTeamColors(game.awayTeam)
  const homeLogo = getTeamLogo(game.homeTeam)
  const awayLogo = getTeamLogo(game.awayTeam)
  const homeForm = getTeamForm(game.homeTeamId)
  const awayForm = getTeamForm(game.awayTeamId)
  const homeFormRecord = getTeamFormRecord(game.homeTeamId)
  const awayFormRecord = getTeamFormRecord(game.awayTeamId)
  
  const gameDate = new Date(game.date)
  const isComplete = game.isComplete

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${
      isLocked ? 'opacity-75' : ''
    }`}>
      {/* Game Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-gray-900">
            Round {game.round} • {game.venue}
          </div>
          {isComplete && (
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
              Final: {game.homeScore} - {game.awayScore}
            </span>
          )}
          {isLocked && !isComplete && (
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Locked
            </span>
          )}
        </div>
        <div className="text-sm text-gray-500">
          {gameDate.toLocaleDateString('en-AU', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>

      {/* Team Selection */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Home Team */}
        <button
          onClick={() => !isLocked && onUpdateTip({ predictedWinner: game.homeTeamId })}
          disabled={isLocked}
          className={`p-4 rounded-lg border-2 transition-all ${
            userTip?.predictedWinner === game.homeTeamId
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-200 hover:border-gray-300'
          } ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}`}
        >
          <div className="space-y-3">
            {/* Team Header */}
            <div className="flex items-center gap-3">
              {homeLogo ? (
                <img 
                  src={homeLogo} 
                  alt={`${game.homeTeam} logo`}
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    // Fallback to color circle if logo fails to load
                    e.currentTarget.style.display = 'none'
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement
                    if (fallback) fallback.style.display = 'block'
                  }}
                />
              ) : null}
              <div 
                className="w-8 h-8 rounded-full"
                style={{ 
                  backgroundColor: homeColors.primary,
                  display: homeLogo ? 'none' : 'block'
                }}
              />
              <div className="text-left flex-1">
                <div className="font-semibold text-gray-900">{homeTeam?.nickname || game.homeTeam}</div>
                <div className="text-xs text-gray-500">Home</div>
              </div>
            </div>

            {/* Team Form */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600">Last 5 games</div>
                <div className="text-xs font-medium text-gray-900">
                  {homeFormRecord.wins}W-{homeFormRecord.losses}L
                </div>
              </div>
              <div className="flex gap-1">
                {homeForm.map((match, index) => (
                  <div
                    key={index}
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      match.result === 'W' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    title={`${match.result} vs ${match.opponent} (${match.score})`}
                  >
                    {match.result}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </button>

        {/* Away Team */}
        <button
          onClick={() => !isLocked && onUpdateTip({ predictedWinner: game.awayTeamId })}
          disabled={isLocked}
          className={`p-4 rounded-lg border-2 transition-all ${
            userTip?.predictedWinner === game.awayTeamId
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-200 hover:border-gray-300'
          } ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}`}
        >
          <div className="space-y-3">
            {/* Team Header */}
            <div className="flex items-center gap-3">
              {awayLogo ? (
                <img 
                  src={awayLogo} 
                  alt={`${game.awayTeam} logo`}
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement
                    if (fallback) fallback.style.display = 'block'
                  }}
                />
              ) : null}
              <div 
                className="w-8 h-8 rounded-full"
                style={{ 
                  backgroundColor: awayColors.primary,
                  display: awayLogo ? 'none' : 'block'
                }}
              />
              <div className="text-left flex-1">
                <div className="font-semibold text-gray-900">{awayTeam?.nickname || game.awayTeam}</div>
                <div className="text-xs text-gray-500">Away</div>
              </div>
            </div>

            {/* Team Form */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600">Last 5 games</div>
                <div className="text-xs font-medium text-gray-900">
                  {awayFormRecord.wins}W-{awayFormRecord.losses}L
                </div>
              </div>
              <div className="flex gap-1">
                {awayForm.map((match, index) => (
                  <div
                    key={index}
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      match.result === 'W' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    title={`${match.result} vs ${match.opponent} (${match.score})`}
                  >
                    {match.result}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Additional Options */}
      {(allowMargin || allowConfidence) && userTip?.predictedWinner && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          {allowMargin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Winning Margin
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={userTip.margin || ''}
                onChange={(e) => onUpdateTip({ margin: parseInt(e.target.value) || undefined })}
                disabled={isLocked}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g. 12 points"
              />
            </div>
          )}

          {allowConfidence && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confidence (1-9)
              </label>
              <input
                type="number"
                min="1"
                max="9"
                value={userTip.confidence || ''}
                onChange={(e) => onUpdateTip({ confidence: parseInt(e.target.value) || undefined })}
                disabled={isLocked}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1 = least confident, 9 = most confident"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}