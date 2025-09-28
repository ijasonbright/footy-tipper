'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Target, 
  Save, 
  CheckCircle,
  Calendar,
  TrendingUp,
  Star,
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
  1: 8, 2: 2, 3: 4, 4: 6, 5: 11, 6: 9, 7: 3, 8: 15, 9: 7, 10: 12,
  11: 5, 12: 18, 13: 1, 14: 13, 15: 10, 16: 14, 17: 16, 18: 17
}

// Team logos
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

  const { allowConfidence = false, allowMargin = false } = competitionSettings

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
        const result = await response.json()
        setMessage(`✅ Saved ${tipsToSave.length} tips!`)
        
        // Force reload tips to ensure they persist
        setTimeout(() => {
          loadUserTips(games.map(g => g.id))
          setMessage('')
        }, 1500)
      } else {
        const error = await response.json()
        setMessage(`❌ Error: ${error.message}`)
      }
    } catch (error) {
      setMessage('❌ Failed to save tips')
    }
    setSaving(false)
  }

  // Round navigation
  const goToPrevRound = () => {
    if (currentRound > 1) loadGames(currentRound - 1)
  }

  const goToNextRound = () => {
    if (currentRound < 5) loadGames(currentRound + 1)
  }

  // Auto-assign confidence
  const autoAssignConfidence = () => {
    const activeTips = Array.from(userTips.values()).filter(tip => tip.predictedWinner > 0)
    activeTips.forEach((tip, index) => {
      updateTip(tip.gameId, { confidence: activeTips.length - index })
    })
    setMessage(`🎯 Auto-assigned confidence`)
    setTimeout(() => setMessage(''), 2000)
  }

  useEffect(() => {
    loadGames()
  }, [])

  const completedTips = Array.from(userTips.values()).filter(tip => tip.predictedWinner > 0).length
  const totalGames = games.filter(g => !g.isComplete).length

  return (
    // FULL SCREEN MOBILE CONTAINER
    <div className="fixed inset-0 bg-white overflow-hidden">
      <div className="flex flex-col h-full max-w-sm mx-auto">
        
        {/* MOBILE HEADER - FIXED */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Target className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="text-base font-semibold text-gray-900 truncate">
                  Round {currentRound} Tips
                </h1>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-lg font-bold text-gray-900">
                {completedTips}/{totalGames}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-700">
                🧪 Test
              </span>
              {completedTips === totalGames && totalGames > 0 && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Done
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {allowConfidence && (
                <Button
                  onClick={autoAssignConfidence}
                  disabled={completedTips === 0}
                  variant="outline"
                  size="sm"
                  className="text-xs h-6 px-2"
                >
                  <Star className="w-3 h-3" />
                </Button>
              )}
              
              <Button
                onClick={saveTips}
                disabled={saving || completedTips === 0}
                className="bg-blue-600 hover:bg-blue-700 text-xs h-6 px-2"
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

          {message && (
            <div className={`mt-2 p-2 rounded text-xs ${
              message.includes('❌') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
            }`}>
              {message}
            </div>
          )}
        </div>

        {/* ROUND NAVIGATION - FIXED */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 p-2">
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={goToPrevRound}
              disabled={currentRound <= 1 || loading}
              variant="outline"
              size="sm"
              className="w-8 h-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="text-center">
              <div className="text-sm font-medium text-gray-700">Round</div>
              <div className="text-xl font-bold text-blue-600">{currentRound}</div>
            </div>
            
            <Button
              onClick={goToNextRound}
              disabled={currentRound >= 5 || loading}
              variant="outline"
              size="sm"
              className="w-8 h-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* SCROLLABLE GAMES LIST */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600 text-sm">Loading...</p>
            </div>
          ) : games.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No games for Round {currentRound}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {games.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  userTip={userTips.get(game.id)}
                  onUpdateTip={(updates) => updateTip(game.id, updates)}
                  allowConfidence={allowConfidence}
                  allowMargin={allowMargin}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Team Logo Component
function TeamLogo({ teamName, size = 24 }: { teamName: string, size?: number }) {
  const [hasError, setHasError] = useState(false)
  const logoUrl = getTeamLogo(teamName)
  const teamColors = getTeamColors(teamName)

  if (hasError || !logoUrl) {
    return (
      <div 
        className="rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
        style={{ 
          width: size, 
          height: size, 
          backgroundColor: teamColors.primary,
          fontSize: size * 0.4
        }}
      >
        {teamName.charAt(0)}
      </div>
    )
  }

  return (
    <img
      src={logoUrl}
      alt={teamName}
      width={size}
      height={size}
      className="object-contain flex-shrink-0"
      onError={() => setHasError(true)}
    />
  )
}

// Game Card Component
interface GameCardProps {
  game: Game
  userTip?: UserTip
  onUpdateTip: (updates: Partial<UserTip>) => void
  allowConfidence: boolean
  allowMargin: boolean
}

function GameCard({ game, userTip, onUpdateTip, allowConfidence }: GameCardProps) {
  const homeTeam = getTeamById(game.homeTeamId)
  const awayTeam = getTeamById(game.awayTeamId)
  const homeColors = getTeamColors(game.homeTeam)
  const awayColors = getTeamColors(game.awayTeam)
  const homeForm = getTeamForm(game.homeTeamId)
  const awayForm = getTeamForm(game.awayTeamId)
  const homeLadderPos = LADDER_POSITIONS[game.homeTeamId] || 0
  const awayLadderPos = LADDER_POSITIONS[game.awayTeamId] || 0
  
  const gameDate = new Date(game.date)

  // Slider state
  const [sliderValue, setSliderValue] = useState(() => {
    if (!userTip?.predictedWinner) return 0
    const margin = userTip.margin || 1
    return userTip.predictedWinner === game.homeTeamId ? -margin : margin
  })

  // Update slider when userTip changes (for persistence)
  useEffect(() => {
    if (!userTip?.predictedWinner) {
      setSliderValue(0)
    } else {
      const margin = userTip.margin || 1
      setSliderValue(userTip.predictedWinner === game.homeTeamId ? -margin : margin)
    }
  }, [userTip, game.homeTeamId])

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
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      {/* Game Header */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="font-medium text-gray-900 truncate flex-1">
          {game.venue}
        </span>
        <span className="text-gray-500 flex-shrink-0">
          {gameDate.toLocaleDateString('en-AU', { 
            weekday: 'short', 
            day: 'numeric' 
          })}
        </span>
      </div>

      {/* Teams */}
      <div className="space-y-2 mb-3">
        {/* Home Team */}
        <div className={`p-2 rounded border ${
          userTip?.predictedWinner === game.homeTeamId
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <TeamLogo teamName={game.homeTeam} size={24} />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm text-gray-900 truncate">
                  {homeTeam?.nickname || game.homeTeam}
                </div>
                <div className="text-xs text-gray-500">
                  Home • #{homeLadderPos}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {homeForm.slice(0, 2).map((match, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    match.result === 'W' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
              ))}
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
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <TeamLogo teamName={game.awayTeam} size={24} />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm text-gray-900 truncate">
                  {awayTeam?.nickname || game.awayTeam}
                </div>
                <div className="text-xs text-gray-500">
                  Away • #{awayLadderPos}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {awayForm.slice(0, 2).map((match, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    match.result === 'W' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Slider */}
      <div className="p-2 bg-gray-50 rounded">
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="font-medium text-gray-700">Winner & Margin</span>
          <span className="text-gray-600">
            {sliderValue === 0 ? 'No tip' : 
             `${sliderValue < 0 ? homeTeam?.nickname : awayTeam?.nickname} by ${Math.abs(sliderValue)}`}
          </span>
        </div>
        
        <input
          type="range"
          min="-100"
          max="100"
          value={sliderValue}
          onChange={(e) => handleSliderChange(parseInt(e.target.value))}
          className="w-full h-6 rounded-lg appearance-none cursor-pointer mobile-slider"
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

      {/* Confidence */}
      {allowConfidence && userTip?.predictedWinner && (
        <div className="pt-2 border-t border-gray-200 mt-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Confidence (1-9)
          </label>
          <input
            type="number"
            min="1"
            max="9"
            value={userTip.confidence || ''}
            onChange={(e) => onUpdateTip({ confidence: parseInt(e.target.value) || undefined })}
            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="1-9"
          />
        </div>
      )}

      {/* Mobile Slider Styles */}
      <style jsx>{`
        .mobile-slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          border: 2px solid white;
        }
        
        .mobile-slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
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