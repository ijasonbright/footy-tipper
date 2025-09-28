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
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { getTeamColors, getTeamForm, getTeamFormRecord, getTeamById } from '@/lib/mock-game-service'

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

// Mock ladder positions
const LADDER_POSITIONS: Record<number, number> = {
  1: 8,   // Adelaide - 8th
  2: 2,   // Brisbane Lions - 2nd
  3: 4,   // Carlton - 4th
  4: 6,   // Collingwood - 6th
  5: 11,  // Essendon - 11th
  6: 9,   // Fremantle - 9th
  7: 3,   // Geelong - 3rd
  8: 15,  // Gold Coast - 15th
  9: 7,   // GWS - 7th
  10: 12, // Hawthorn - 12th
  11: 5,  // Melbourne - 5th
  12: 18, // North Melbourne - 18th
  13: 1,  // Port Adelaide - 1st
  14: 13, // Richmond - 13th
  15: 10, // St Kilda - 10th
  16: 14, // Sydney - 14th
  17: 16, // West Coast - 16th
  18: 17  // Western Bulldogs - 17th
}

// Correct Squiggle logo URLs
const getTeamLogo = (teamName: string): string => {
  const logoMap: Record<string, string> = {
    'Adelaide': 'https://squiggle.com.au/wp-content/themes/squiggle/assets/images/Adelaide.png',
    'Brisbane Lions': 'https://squiggle.com.au/wp-content/themes/squiggle/assets/images/Brisbane.png',
    'Carlton': 'https://squiggle.com.au/wp-content/themes/squiggle/assets/images/Carlton.png',
    'Collingwood': 'https://squiggle.com.au/wp-content/themes/squiggle/assets/images/Collingwood.png',
    'Essendon': 'https://squiggle.com.au/wp-content/themes/squiggle/assets/images/Essendon.png',
    'Fremantle': 'https://squiggle.com.au/wp-content/themes/squiggle/assets/images/Fremantle.png',
    'Geelong': 'https://squiggle.com.au/wp-content/themes/squiggle/assets/images/Geelong.png',
    'Gold Coast': 'https://squiggle.com.au/wp-content/themes/squiggle/assets/images/GoldCoast.png',
    'GWS': 'https://squiggle.com.au/wp-content/themes/squiggle/assets/images/Giants.png',
    'Greater Western Sydney': 'https://squiggle.com.au/wp-content/themes/squiggle/assets/images/Giants.png',
    'Hawthorn': 'https://squiggle.com.au/wp-content/themes/squiggle/assets/images/Hawthorn.png',
    'Melbourne': 'https://squiggle.com.au/wp-content/themes/squiggle/assets/images/Melbourne.png',
    'North Melbourne': 'https://squiggle.com.au/wp-content/themes/squiggle/assets/images/NorthMelbourne.png',
    'Port Adelaide': 'https://squiggle.com.au/wp-content/themes/squiggle/assets/images/PortAdelaide.png',
    'Richmond': 'https://squiggle.com.au/wp-content/themes/squiggle/assets/images/Richmond.png',
    'St Kilda': 'https://squiggle.com.au/wp-content/themes/squiggle/assets/images/StKilda.png',
    'Sydney': 'https://squiggle.com.au/wp-content/themes/squiggle/assets/images/Sydney.png',
    'West Coast': 'https://squiggle.com.au/wp-content/themes/squiggle/assets/images/WestCoast.png',
    'Western Bulldogs': 'https://squiggle.com.au/wp-content/themes/squiggle/assets/images/Bulldogs.png'
  }
  
  return logoMap[teamName] || ''
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
      url.searchParams.set('source', 'mock')
      
      const response = await fetch(url.toString())
      const data = await response.json()
      
      if (response.ok) {
        setGames(data.games)
        setCurrentRound(data.currentRound)
        setDataSource(data.source)
        setMessage('')
        
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
        tip.predictedWinner > 0
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

  // Check if game tipping is locked
  const isGameLocked = (game: Game) => {
    return game.isComplete
  }

  // Get confidence rankings
  const getConfidenceRankings = () => {
    const tipsWithConfidence = Array.from(userTips.values())
      .filter(tip => tip.confidence && tip.confidence > 0)
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
    
    return tipsWithConfidence
  }

  // Auto-assign confidence points
  const autoAssignConfidence = () => {
    const activeTips = Array.from(userTips.values()).filter(tip => tip.predictedWinner > 0)
    
    activeTips.forEach((tip, index) => {
      updateTip(tip.gameId, { confidence: activeTips.length - index })
    })
    
    setMessage(`🎯 Auto-assigned confidence points (${activeTips.length} tips)`)
    setTimeout(() => setMessage(''), 3000)
  }

  // Round navigation helpers
  const goToPrevRound = () => {
    if (currentRound > 1) {
      loadGames(currentRound - 1)
    }
  }

  const goToNextRound = () => {
    if (currentRound < 5) {
      loadGames(currentRound + 1)
    }
  }

  useEffect(() => {
    loadGames()
  }, [])

  const completedTips = Array.from(userTips.values()).filter(tip => tip.predictedWinner > 0).length
  const totalGames = games.filter(g => !g.isComplete).length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Container */}
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Compact Header */}
        <div className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
          {/* Title Row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Target className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold text-gray-900 truncate">
                  Round {currentRound} Tipping
                </h1>
                <p className="text-xs text-gray-600">Make your predictions</p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-lg font-bold text-gray-900">
                {completedTips}/{totalGames}
              </div>
              <div className="text-xs text-gray-500">Tips</div>
            </div>
          </div>

          {/* Status and Actions Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                🧪 Testing
              </span>
              
              {completedTips === totalGames && totalGames > 0 && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Done
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
                  className="text-xs h-7 px-2"
                >
                  <Star className="w-3 h-3" />
                </Button>
              )}
              
              <Button
                onClick={saveTips}
                disabled={saving || completedTips === 0}
                className="bg-blue-600 hover:bg-blue-700 text-xs h-7 px-3"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="w-3 h-3 mr-1" />
                    Save ({completedTips})
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`mt-2 p-2 rounded text-xs ${
              message.includes('❌') 
                ? 'bg-red-50 text-red-800'
                : 'bg-green-50 text-green-800'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* Mobile Round Navigation */}
        <div className="bg-white border-b border-gray-200 p-3">
          <div className="flex items-center justify-between">
            <Button
              onClick={goToPrevRound}
              disabled={currentRound <= 1 || loading}
              variant="outline"
              size="sm"
              className="w-10 h-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-gray-700">Round</span>
              <span className="text-lg font-bold text-blue-600">{currentRound}</span>
              <span className="text-sm text-gray-500">of 5</span>
            </div>
            
            <Button
              onClick={goToNextRound}
              disabled={currentRound >= 5 || loading}
              variant="outline"
              size="sm"
              className="w-10 h-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Games List */}
        <div className="p-3 space-y-3">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-sm">Loading games...</p>
            </div>
          ) : games.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No games for Round {currentRound}</p>
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
          <div className="p-3 border-t border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              Confidence Rankings
            </h4>
            <div className="space-y-2">
              {getConfidenceRankings().map((tip, index) => {
                const game = games.find(g => g.id === tip.gameId)
                if (!game) return null
                
                return (
                  <div key={tip.gameId} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {tip.confidence}
                    </div>
                    <div className="flex-1 text-xs min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {tip.predictedWinner === game.homeTeamId ? game.homeTeam : game.awayTeam}
                      </div>
                      <div className="text-gray-500 truncate">
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
    </div>
  )
}

// Enhanced Team Logo Component
function TeamLogo({ teamName, size = 28, className = "" }: { teamName: string, size?: number, className?: string }) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const logoUrl = getTeamLogo(teamName)
  const teamColors = getTeamColors(teamName)

  const handleError = () => {
    setHasError(true)
    setIsLoading(false)
  }

  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  if (hasError || !logoUrl) {
    const teamInitial = teamName.charAt(0).toUpperCase()
    return (
      <div 
        className={`rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ${className}`}
        style={{ 
          width: size, 
          height: size, 
          backgroundColor: teamColors.primary,
          fontSize: size * 0.4
        }}
        title={teamName}
      >
        {teamInitial}
      </div>
    )
  }

  return (
    <div className="relative flex-shrink-0">
      {isLoading && (
        <div 
          className="absolute inset-0 rounded-full flex items-center justify-center bg-gray-100"
          style={{ width: size, height: size }}
        >
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
        </div>
      )}
      <img
        src={logoUrl}
        alt={`${teamName} logo`}
        width={size}
        height={size}
        className={`object-contain ${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
        onError={handleError}
        onLoad={handleLoad}
        loading="eager"
        title={teamName}
      />
    </div>
  )
}

// Mobile-Optimized Game Card
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
  const homeForm = getTeamForm(game.homeTeamId)
  const awayForm = getTeamForm(game.awayTeamId)
  const homeFormRecord = getTeamFormRecord(game.homeTeamId)
  const awayFormRecord = getTeamFormRecord(game.awayTeamId)
  const homeLadderPos = LADDER_POSITIONS[game.homeTeamId] || 0
  const awayLadderPos = LADDER_POSITIONS[game.awayTeamId] || 0
  
  const gameDate = new Date(game.date)
  const isComplete = game.isComplete

  // Slider state for winner/margin selection
  const [sliderValue, setSliderValue] = useState(() => {
    if (!userTip?.predictedWinner) return 0
    const margin = userTip.margin || 1
    return userTip.predictedWinner === game.homeTeamId ? -margin : margin
  })

  // Convert slider value to tip
  const handleSliderChange = (value: number) => {
    setSliderValue(value)
    
    if (value === 0) {
      onUpdateTip({ predictedWinner: 0, margin: 0 })
    } else {
      const winner = value < 0 ? game.homeTeamId : game.awayTeamId
      const margin = Math.abs(value)
      onUpdateTip({ predictedWinner: winner, margin })
    }
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-3 ${
      isLocked ? 'opacity-75' : ''
    }`}>
      {/* Compact Game Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-medium text-gray-900 truncate flex-1">
          {game.venue}
        </div>
        <div className="text-xs text-gray-500 flex-shrink-0">
          {gameDate.toLocaleDateString('en-AU', {
            weekday: 'short',
            day: 'numeric'
          })}
        </div>
      </div>

      {/* Teams Display - Mobile Stacked */}
      <div className="space-y-2 mb-3">
        {/* Home Team */}
        <div className={`p-2 rounded border ${
          userTip?.predictedWinner === game.homeTeamId
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <TeamLogo teamName={game.homeTeam} size={28} />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm text-gray-900 truncate">
                  {homeTeam?.nickname || game.homeTeam}
                </div>
                <div className="text-xs text-gray-500">
                  Home • #{homeLadderPos}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="text-xs text-gray-600">
                {homeFormRecord.wins}W-{homeFormRecord.losses}L
              </div>
              <div className="flex gap-1">
                {homeForm.slice(0, 2).map((match, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full ${
                      match.result === 'W' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Away Team */}
        <div className={`p-2 rounded border ${
          userTip?.predictedWinner === game.awayTeamId
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <TeamLogo teamName={game.awayTeam} size={28} />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm text-gray-900 truncate">
                  {awayTeam?.nickname || game.awayTeam}
                </div>
                <div className="text-xs text-gray-500">
                  Away • #{awayLadderPos}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="text-xs text-gray-600">
                {awayFormRecord.wins}W-{awayFormRecord.losses}L
              </div>
              <div className="flex gap-1">
                {awayForm.slice(0, 2).map((match, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full ${
                      match.result === 'W' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Slider */}
      {!isLocked && (
        <div className="p-2 bg-gray-50 rounded">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-gray-700">Winner & Margin</div>
            <div className="text-xs text-gray-500">
              {sliderValue === 0 ? 'No tip' : 
               `${sliderValue < 0 ? homeTeam?.nickname : awayTeam?.nickname} by ${Math.abs(sliderValue)}`}
            </div>
          </div>
          
          <div className="relative">
            <input
              type="range"
              min="-100"
              max="100"
              value={sliderValue}
              onChange={(e) => handleSliderChange(parseInt(e.target.value))}
              className="w-full h-6 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, 
                  ${homeColors.primary} 0%, 
                  ${homeColors.primary} 45%, 
                  #e5e7eb 45%, 
                  #e5e7eb 55%, 
                  ${awayColors.primary} 55%, 
                  ${awayColors.primary} 100%)`
              }}
            />
          </div>
        </div>
      )}

      {/* Confidence Selection */}
      {allowConfidence && userTip?.predictedWinner && (
        <div className="pt-2 border-t border-gray-200 mt-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Confidence (1-9)
          </label>
          <input
            type="number"
            min="1"
            max="9"
            value={userTip.confidence || ''}
            onChange={(e) => onUpdateTip({ confidence: parseInt(e.target.value) || undefined })}
            disabled={isLocked}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="1-9"
          />
        </div>
      )}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 24px;
          width: 24px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          border: 2px solid white;
        }
        
        .slider::-moz-range-thumb {
          height: 24px;
          width: 24px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  )
}