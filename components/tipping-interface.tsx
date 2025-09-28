'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Target, 
  Save, 
  CheckCircle,
  Calendar,
  Star,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Award
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
  winner?: number
}

interface UserTip {
  id?: string
  gameId: string
  predictedWinner: number
  margin?: number
  confidence?: number
  isCorrect?: boolean
  marginRank?: number
  points?: number
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
        const newRound = round || data.currentRound
        setCurrentRound(newRound)
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

  // Load user's existing tips with results
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
            confidence: tip.confidence,
            isCorrect: tip.isCorrect,
            marginRank: tip.marginRank,
            points: tip.points
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
        setMessage(`✅ Saved ${tipsToSave.length} tips!`)
        
        // Reload tips to get updated results
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
    if (currentRound > 1) {
      loadGames(currentRound - 1)
    }
  }

  const goToNextRound = () => {
    if (currentRound < 25) {
      loadGames(currentRound + 1)
    }
  }

  const goToRound = (round: number) => {
    loadGames(round)
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
  const isRoundComplete = games.length > 0 && games.every(g => g.isComplete)

  return (
    <div className="w-full bg-gray-50">
      {/* FIXED STICKY HEADER WITH SAVE - Higher z-index */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto p-3 md:p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              <h1 className="text-lg md:text-xl font-semibold text-gray-900">
                Round {currentRound} {isRoundComplete ? 'Results' : 'Tipping'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {completedTips}/{totalGames > 0 ? totalGames : games.length}
                </div>
                <div className="text-xs text-gray-500">Tips</div>
              </div>
              
              {!isRoundComplete && (
                <Button
                  onClick={saveTips}
                  disabled={saving || completedTips === 0}
                  className="bg-blue-600 hover:bg-blue-700 ml-2"
                  size="sm"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-1" />
                      Save ({completedTips})
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Status and Actions */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-700">
                🧪 Testing Mode
              </span>
              {isRoundComplete && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Round Complete
                </span>
              )}
              {completedTips === totalGames && totalGames > 0 && !isRoundComplete && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  All Tips Complete
                </span>
              )}
            </div>

            {!isRoundComplete && allowConfidence && (
              <Button
                onClick={autoAssignConfidence}
                disabled={completedTips === 0}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Star className="w-3 h-3 mr-1" />
                Auto Confidence
              </Button>
            )}
          </div>

          {message && (
            <div className={`mt-3 p-2 rounded text-xs ${
              message.includes('❌') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>

      {/* FIXED STICKY ROUND NAVIGATION - Below header */}
      <div className="fixed top-[120px] md:top-[130px] left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto p-3">
          <div className="flex items-center justify-center gap-4 mb-3">
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
              <div className="text-xl md:text-2xl font-bold text-blue-600">{currentRound}</div>
            </div>
            
            <Button
              onClick={goToNextRound}
              disabled={currentRound >= 25 || loading}
              variant="outline"
              size="sm"
              className="w-8 h-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Round Number Grid */}
          <div className="flex flex-wrap justify-center gap-1">
            {Array.from({ length: Math.min(10, 25) }, (_, i) => i + 1).map(round => (
              <Button
                key={round}
                onClick={() => goToRound(round)}
                disabled={loading}
                variant={round === currentRound ? "default" : "outline"}
                size="sm"
                className="w-8 h-8 p-0 text-xs"
              >
                {round}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT - With top padding to account for fixed headers */}
      <div className="pt-[200px] md:pt-[210px]">
        <div className="max-w-4xl mx-auto p-3 md:p-4 space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600 text-sm">Loading games...</p>
            </div>
          ) : games.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No games available for Round {currentRound}</p>
            </div>
          ) : (
            games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                userTip={userTips.get(game.id)}
                onUpdateTip={(updates) => updateTip(game.id, updates)}
                allowConfidence={allowConfidence}
                isRoundComplete={isRoundComplete}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// Team Logo Component
function TeamLogo({ teamName, size = 32 }: { teamName: string, size?: number }) {
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

// Game Card Component with Fixed Margin Ranking
interface GameCardProps {
  game: Game
  userTip?: UserTip
  onUpdateTip: (updates: Partial<UserTip>) => void
  allowConfidence: boolean
  isRoundComplete: boolean
}

function GameCard({ game, userTip, onUpdateTip, allowConfidence, isRoundComplete }: GameCardProps) {
  const homeTeam = getTeamById(game.homeTeamId)
  const awayTeam = getTeamById(game.awayTeamId)
  const homeColors = getTeamColors(game.homeTeam)
  const awayColors = getTeamColors(game.awayTeam)
  const homeForm = getTeamForm(game.homeTeamId)
  const awayForm = getTeamForm(game.awayTeamId)
  const homeLadderPos = LADDER_POSITIONS[game.homeTeamId] || 0
  const awayLadderPos = LADDER_POSITIONS[game.awayTeamId] || 0
  
  const gameDate = new Date(game.date)

  // Determine winner for completed games
  const actualWinner = game.isComplete && game.homeScore !== null && game.awayScore !== null 
    ? (game.homeScore > game.awayScore ? game.homeTeamId : game.awayTeamId)
    : null

  // Check if tip is correct
  const isCorrect = userTip?.predictedWinner && actualWinner 
    ? userTip.predictedWinner === actualWinner 
    : null

  // Calculate actual margin
  const actualMargin = game.isComplete && game.homeScore !== null && game.awayScore !== null
    ? Math.abs(game.homeScore - game.awayScore)
    : null

  // Calculate margin accuracy (how close was the prediction)
  const marginAccuracy = userTip?.margin && actualMargin 
    ? Math.abs(userTip.margin - actualMargin)
    : null

  // Slider state
  const [sliderValue, setSliderValue] = useState(() => {
    if (!userTip?.predictedWinner) return 0
    const margin = userTip.margin || 1
    return userTip.predictedWinner === game.homeTeamId ? -margin : margin
  })

  // Update slider when userTip changes
  useEffect(() => {
    if (!userTip?.predictedWinner) {
      setSliderValue(0)
    } else {
      const margin = userTip.margin || 1
      setSliderValue(userTip.predictedWinner === game.homeTeamId ? -margin : margin)
    }
  }, [userTip, game.homeTeamId])

  const handleSliderChange = (value: number) => {
    if (isRoundComplete) return // Don't allow changes when round is complete
    
    setSliderValue(value)
    
    if (value === 0) {
      onUpdateTip({ predictedWinner: 0, margin: 0 })
    } else {
      const winner = value < 0 ? game.homeTeamId : game.awayTeamId
      const margin = Math.abs(value)
      onUpdateTip({ predictedWinner: winner, margin })
    }
  }

  // Get border color based on result
  const getBorderColor = (teamId: number) => {
    if (!isRoundComplete || !userTip?.predictedWinner) {
      return userTip?.predictedWinner === teamId ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
    }
    
    if (userTip.predictedWinner === teamId) {
      return isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
    }
    
    return 'border-gray-200'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      {/* Game Header */}
      <div className="flex items-center justify-between mb-4 text-sm">
        <span className="font-medium text-gray-900 truncate flex-1">
          {game.venue}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">
            {gameDate.toLocaleDateString('en-AU', { 
              weekday: 'short', 
              day: 'numeric',
              month: 'short'
            })}
          </span>
          {isRoundComplete && userTip?.points && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
              {userTip.points} pts
            </span>
          )}
        </div>
      </div>

      {/* Teams */}
      <div className="space-y-3 mb-4">
        {/* Home Team */}
        <div className={`p-3 rounded-lg border-2 transition-all ${getBorderColor(game.homeTeamId)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <TeamLogo teamName={game.homeTeam} size={28} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-gray-900 text-sm">
                  {homeTeam?.nickname || game.homeTeam}
                </div>
                <div className="text-xs text-gray-500">
                  Home • #{homeLadderPos}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isRoundComplete && game.homeScore !== null && (
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {game.homeScore}
                  </div>
                  {actualWinner === game.homeTeamId && (
                    <Trophy className="w-4 h-4 text-yellow-500 mx-auto" />
                  )}
                </div>
              )}
              <div className="hidden sm:flex gap-1">
                {homeForm.slice(0, 3).map((match, i) => (
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

        {/* Away Team */}
        <div className={`p-3 rounded-lg border-2 transition-all ${getBorderColor(game.awayTeamId)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <TeamLogo teamName={game.awayTeam} size={28} />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-gray-900 text-sm">
                  {awayTeam?.nickname || game.awayTeam}
                </div>
                <div className="text-xs text-gray-500">
                  Away • #{awayLadderPos}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isRoundComplete && game.awayScore !== null && (
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {game.awayScore}
                  </div>
                  {actualWinner === game.awayTeamId && (
                    <Trophy className="w-4 h-4 text-yellow-500 mx-auto" />
                  )}
                </div>
              )}
              <div className="hidden sm:flex gap-1">
                {awayForm.slice(0, 3).map((match, i) => (
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
      </div>

      {/* Results Summary for Completed Games - Fixed Margin Ranking */}
      {isRoundComplete && userTip?.predictedWinner && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {isCorrect ? (
                <div className="flex items-center gap-1 text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Correct!</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-700">
                  <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white text-xs">✗</span>
                  </div>
                  <span className="font-medium">Incorrect</span>
                </div>
              )}
            </div>
            
            <div className="text-gray-600 text-right">
              {actualMargin && (
                <div>Actual margin: {actualMargin} points</div>
              )}
              {marginAccuracy !== null && (
                <div className="text-xs">
                  Off by: {marginAccuracy} points
                </div>
              )}
              {userTip.marginRank && (
                <div className="flex items-center gap-1 text-blue-600">
                  <Award className="w-3 h-3" />
                  <span className="font-medium">#{userTip.marginRank} closest margin</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Slider - Only show if round not complete */}
      {!isRoundComplete && (
        <div className="p-3 bg-gray-50 rounded-lg mb-3">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="font-medium text-gray-700">Winner & Margin</span>
            <span className="text-gray-600">
              {sliderValue === 0 ? 'No tip selected' : 
               `${sliderValue < 0 ? homeTeam?.nickname : awayTeam?.nickname} by ${Math.abs(sliderValue)}`}
            </span>
          </div>
          
          <input
            type="range"
            min="-100"
            max="100"
            value={sliderValue}
            onChange={(e) => handleSliderChange(parseInt(e.target.value))}
            className="w-full h-6 rounded-lg appearance-none cursor-pointer responsive-slider"
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
      )}

      {/* Show selected tip for completed rounds */}
      {isRoundComplete && userTip?.predictedWinner && (
        <div className="p-3 bg-gray-50 rounded-lg mb-3">
          <div className="text-sm">
            <span className="font-medium text-gray-700">Your Tip: </span>
            <span className="text-gray-900">
              {userTip.predictedWinner === game.homeTeamId ? homeTeam?.nickname : awayTeam?.nickname}
              {userTip.margin && ` by ${userTip.margin}`}
            </span>
          </div>
        </div>
      )}

      {/* Confidence - Only show if round not complete */}
      {!isRoundComplete && allowConfidence && userTip?.predictedWinner && (
        <div className="pt-3 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confidence (1-9)
          </label>
          <input
            type="number"
            min="1"
            max="9"
            value={userTip.confidence || ''}
            onChange={(e) => onUpdateTip({ confidence: parseInt(e.target.value) || undefined })}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="1 = least confident, 9 = most confident"
          />
        </div>
      )}

      {/* Show confidence for completed rounds */}
      {isRoundComplete && userTip?.confidence && (
        <div className="pt-3 border-t border-gray-200">
          <div className="text-sm">
            <span className="font-medium text-gray-700">Confidence: </span>
            <span className="text-gray-900">{userTip.confidence}/9</span>
          </div>
        </div>
      )}

      {/* Slider Styles */}
      <style jsx>{`
        .responsive-slider::-webkit-slider-thumb {
          appearance: none;
          height: 24px;
          width: 24px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          border: 3px solid white;
        }
        
        .responsive-slider::-moz-range-thumb {
          height: 24px;
          width: 24px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  )
}