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

// Updated team logo URLs - using multiple sources as fallbacks
const getTeamLogos = (teamName: string) => {
  const logoSources = {
    'Adelaide': [
      'https://resources.afl.com.au/afl/logos/adelaide-crows.svg',
      'https://squiggle.com.au/static/logos/ade.svg',
      'https://www.afl.com.au/static-assets/images/clubs/adelaide.svg'
    ],
    'Brisbane Lions': [
      'https://resources.afl.com.au/afl/logos/brisbane-lions.svg',
      'https://squiggle.com.au/static/logos/brl.svg',
      'https://www.afl.com.au/static-assets/images/clubs/brisbane.svg'
    ],
    'Carlton': [
      'https://resources.afl.com.au/afl/logos/carlton.svg',
      'https://squiggle.com.au/static/logos/car.svg',
      'https://www.afl.com.au/static-assets/images/clubs/carlton.svg'
    ],
    'Collingwood': [
      'https://resources.afl.com.au/afl/logos/collingwood.svg',
      'https://squiggle.com.au/static/logos/col.svg',
      'https://www.afl.com.au/static-assets/images/clubs/collingwood.svg'
    ],
    'Essendon': [
      'https://resources.afl.com.au/afl/logos/essendon.svg',
      'https://squiggle.com.au/static/logos/ess.svg',
      'https://www.afl.com.au/static-assets/images/clubs/essendon.svg'
    ],
    'Fremantle': [
      'https://resources.afl.com.au/afl/logos/fremantle.svg',
      'https://squiggle.com.au/static/logos/fre.svg',
      'https://www.afl.com.au/static-assets/images/clubs/fremantle.svg'
    ],
    'Geelong': [
      'https://resources.afl.com.au/afl/logos/geelong-cats.svg',
      'https://squiggle.com.au/static/logos/gee.svg',
      'https://www.afl.com.au/static-assets/images/clubs/geelong.svg'
    ],
    'Gold Coast': [
      'https://resources.afl.com.au/afl/logos/gold-coast-suns.svg',
      'https://squiggle.com.au/static/logos/gcs.svg',
      'https://www.afl.com.au/static-assets/images/clubs/goldcoast.svg'
    ],
    'GWS': [
      'https://resources.afl.com.au/afl/logos/greater-western-sydney-giants.svg',
      'https://squiggle.com.au/static/logos/gws.svg',
      'https://www.afl.com.au/static-assets/images/clubs/gws.svg'
    ],
    'Hawthorn': [
      'https://resources.afl.com.au/afl/logos/hawthorn.svg',
      'https://squiggle.com.au/static/logos/haw.svg',
      'https://www.afl.com.au/static-assets/images/clubs/hawthorn.svg'
    ],
    'Melbourne': [
      'https://resources.afl.com.au/afl/logos/melbourne.svg',
      'https://squiggle.com.au/static/logos/mel.svg',
      'https://www.afl.com.au/static-assets/images/clubs/melbourne.svg'
    ],
    'North Melbourne': [
      'https://resources.afl.com.au/afl/logos/north-melbourne.svg',
      'https://squiggle.com.au/static/logos/nth.svg',
      'https://www.afl.com.au/static-assets/images/clubs/northmelbourne.svg'
    ],
    'Port Adelaide': [
      'https://resources.afl.com.au/afl/logos/port-adelaide.svg',
      'https://squiggle.com.au/static/logos/por.svg',
      'https://www.afl.com.au/static-assets/images/clubs/portadelaide.svg'
    ],
    'Richmond': [
      'https://resources.afl.com.au/afl/logos/richmond.svg',
      'https://squiggle.com.au/static/logos/ric.svg',
      'https://www.afl.com.au/static-assets/images/clubs/richmond.svg'
    ],
    'St Kilda': [
      'https://resources.afl.com.au/afl/logos/st-kilda.svg',
      'https://squiggle.com.au/static/logos/stk.svg',
      'https://www.afl.com.au/static-assets/images/clubs/stkilda.svg'
    ],
    'Sydney': [
      'https://resources.afl.com.au/afl/logos/sydney-swans.svg',
      'https://squiggle.com.au/static/logos/syd.svg',
      'https://www.afl.com.au/static-assets/images/clubs/sydney.svg'
    ],
    'West Coast': [
      'https://resources.afl.com.au/afl/logos/west-coast-eagles.svg',
      'https://squiggle.com.au/static/logos/wce.svg',
      'https://www.afl.com.au/static-assets/images/clubs/westcoast.svg'
    ],
    'Western Bulldogs': [
      'https://resources.afl.com.au/afl/logos/western-bulldogs.svg',
      'https://squiggle.com.au/static/logos/wbd.svg',
      'https://www.afl.com.au/static-assets/images/clubs/westernbulldogs.svg'
    ]
  }
  
  return logoSources[teamName as keyof typeof logoSources] || []
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

  useEffect(() => {
    loadGames()
  }, [])

  const completedTips = Array.from(userTips.values()).filter(tip => tip.predictedWinner > 0).length
  const totalGames = games.filter(g => !g.isComplete).length

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

// Enhanced Team Logo Component with multiple fallbacks
function TeamLogo({ teamName, size = 40, className = "" }: { teamName: string, size?: number, className?: string }) {
  const [currentLogoIndex, setCurrentLogoIndex] = useState(0)
  const [hasError, setHasError] = useState(false)
  const logoUrls = getTeamLogos(teamName)
  const teamColors = getTeamColors(teamName)

  const handleError = () => {
    if (currentLogoIndex < logoUrls.length - 1) {
      setCurrentLogoIndex(prev => prev + 1)
    } else {
      setHasError(true)
    }
  }

  if (hasError || logoUrls.length === 0) {
    // Fallback to colored circle with team initial
    const teamInitial = teamName.charAt(0).toUpperCase()
    return (
      <div 
        className={`rounded-full flex items-center justify-center font-bold text-white ${className}`}
        style={{ 
          width: size, 
          height: size, 
          backgroundColor: teamColors.primary,
          fontSize: size * 0.4
        }}
      >
        {teamInitial}
      </div>
    )
  }

  return (
    <img
      src={logoUrls[currentLogoIndex]}
      alt={`${teamName} logo`}
      width={size}
      height={size}
      className={`object-contain ${className}`}
      onError={handleError}
      loading="lazy"
    />
  )
}

// Individual game tipping card component
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
      // Neutral position - no tip
      onUpdateTip({ predictedWinner: 0, margin: 0 })
    } else {
      const winner = value < 0 ? game.homeTeamId : game.awayTeamId
      const margin = Math.abs(value)
      onUpdateTip({ predictedWinner: winner, margin })
    }
  }

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

      {/* Teams Display */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Home Team */}
        <div className={`p-4 rounded-lg border-2 ${
          userTip?.predictedWinner === game.homeTeamId
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200'
        }`}>
          <div className="space-y-3">
            {/* Team Header */}
            <div className="flex items-center gap-3">
              <TeamLogo teamName={game.homeTeam} size={40} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate">
                  {homeTeam?.nickname || game.homeTeam}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>Home</span>
                  <span>•</span>
                  <span className="font-medium">#{homeLadderPos}</span>
                </div>
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
        </div>

        {/* Away Team */}
        <div className={`p-4 rounded-lg border-2 ${
          userTip?.predictedWinner === game.awayTeamId
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-200'
        }`}>
          <div className="space-y-3">
            {/* Team Header */}
            <div className="flex items-center gap-3">
              <TeamLogo teamName={game.awayTeam} size={40} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate">
                  {awayTeam?.nickname || game.awayTeam}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>Away</span>
                  <span>•</span>
                  <span className="font-medium">#{awayLadderPos}</span>
                </div>
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
        </div>
      </div>

      {/* Interactive Slider for Winner/Margin Selection */}
      {!isLocked && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-gray-700">Winner & Margin</div>
            <div className="text-sm text-gray-500">
              {sliderValue === 0 ? 'No tip selected' : 
               `${sliderValue < 0 ? homeTeam?.nickname : awayTeam?.nickname} by ${Math.abs(sliderValue)} points`}
            </div>
          </div>
          
          <div className="relative">
            {/* Slider Track Labels */}
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>{homeTeam?.nickname} by 100</span>
              <span>Draw</span>
              <span>{awayTeam?.nickname} by 100</span>
            </div>
            
            {/* Slider */}
            <input
              type="range"
              min="-100"
              max="100"
              value={sliderValue}
              onChange={(e) => handleSliderChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
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
            
            {/* Center line indicator */}
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-px h-4 bg-gray-400"></div>
          </div>
        </div>
      )}

      {/* Confidence Selection */}
      {allowConfidence && userTip?.predictedWinner && (
        <div className="pt-4 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confidence Level (1-9)
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

      {/* Custom CSS for slider */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  )
}