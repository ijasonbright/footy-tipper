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
  Award,
  BarChart3,
  Settings,
  Users,
  Eye,
  UserCog,
  Info
} from 'lucide-react'
import { getTeamColors, getTeamForm, getTeamFormRecord, getTeamById } from '@/lib/mock-game-service'
import { useViewMode } from '@/contexts/view-mode-context'

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

// Team form interfaces to match your mock service
interface TeamFormMatch {
  opponent: string
  result: 'W' | 'L'
  score: string
  margin?: number // Made optional since it might not always be present
}

interface TeamFormRecord {
  wins: number
  losses: number
  total?: number // Made optional and will calculate it
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
  const { viewMode, isAdmin } = useViewMode()
  const [games, setGames] = useState<Game[]>([])
  const [userTips, setUserTips] = useState<Map<string, UserTip>>(new Map())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentRound, setCurrentRound] = useState(1)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'tipping' | 'settings'>('tipping')
  const [showTeamModal, setShowTeamModal] = useState<{show: boolean, teamId?: number}>({show: false})

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
    <div className="w-full bg-gray-50 min-h-screen">
      {/* DESKTOP TOP BANNER */}
      <div className="hidden md:block bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Just the logo */}
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-blue-500" />
              <h1 className="text-xl font-bold text-gray-900">AFL Tipper Pro</h1>
            </div>

            {/* Center: Round Navigation */}
            <div className="flex items-center gap-4">
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
                disabled={currentRound >= 25 || loading}
                variant="outline"
                size="sm"
                className="w-8 h-8 p-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>

              {/* Round Number Buttons */}
              <div className="flex gap-1 ml-4">
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

            {/* Right: Admin Toggle and Save */}
            <div className="flex items-center gap-3">
              {/* Admin View Toggle */}
              {isAdmin && (
                <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
                  <Button
                    onClick={() => {}} // View mode is now handled in UserButton menu
                    variant={viewMode === 'user' ? 'default' : 'ghost'}
                    size="sm"
                    className="text-xs h-8"
                    disabled
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    User View
                  </Button>
                  <Button
                    onClick={() => {}} // View mode is now handled in UserButton menu
                    variant={viewMode === 'admin' ? 'default' : 'ghost'}
                    size="sm"
                    className="text-xs h-8"
                    disabled
                  >
                    <UserCog className="w-3 h-3 mr-1" />
                    Admin View
                  </Button>
                </div>
              )}

              {/* Save Button */}
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
                    className="bg-blue-600 hover:bg-blue-700"
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
          </div>
        </div>
      </div>

      {/* MOBILE TOP BANNER */}
      <div className="md:hidden bg-white border-b border-gray-200 shadow-sm">
        <div className="p-3">
          {/* AFL Tipper Pro Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              <h1 className="text-lg font-bold text-gray-900">AFL Tipper Pro</h1>
            </div>
            
            {/* Hamburger Menu (placeholder for future menu) */}
            <button className="p-2">
              <div className="w-5 h-5 flex flex-col justify-center space-y-1">
                <div className="w-5 h-0.5 bg-gray-600"></div>
                <div className="w-5 h-0.5 bg-gray-600"></div>
                <div className="w-5 h-0.5 bg-gray-600"></div>
              </div>
            </button>
          </div>

          {/* Round Navigation Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
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
                <div className="text-xl font-bold text-blue-600">Round {currentRound}</div>
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

            {/* Save Button */}
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
                  className="bg-blue-600 hover:bg-blue-700"
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
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto p-4">
        {/* TAB NAVIGATION - Desktop Only */}
        <div className="hidden md:block mb-4">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Overview
              </div>
            </button>
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'leaderboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Leaderboard
              </div>
            </button>
            <button
              onClick={() => setActiveTab('tipping')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tipping'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Tipping
              </div>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </div>
            </button>
          </nav>
        </div>

        {/* TAB CONTENT */}
        <div className="space-y-4">
          {/* Mobile shows tipping directly, Desktop shows based on activeTab */}
          {(activeTab === 'tipping' || true) && (
            <div className="space-y-4">
              {/* Status Messages - Desktop Only */}
              <div className="hidden md:flex items-center justify-between gap-3">
                {!isRoundComplete && allowConfidence && (
                  <Button
                    onClick={autoAssignConfidence}
                    disabled={completedTips === 0}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    <Star className="w-3 h-3 mr-1" />
                    Auto
                  </Button>
                )}
              </div>

              {message && (
                <div className={`p-2 rounded text-xs ${
                  message.includes('❌') ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-800'
                }`}>
                  {message}
                </div>
              )}

              {/* Games */}
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
                    onShowTeamDetail={(teamId) => setShowTeamModal({show: true, teamId})}
                  />
                ))
              )}
            </div>
          )}

          {/* Desktop-only tabs */}
          {activeTab === 'leaderboard' && (
            <div className="hidden md:block max-w-4xl">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Leaderboard - Round {currentRound}</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">J</div>
                      <div>
                        <div className="font-medium text-gray-900">jasonbright</div>
                        <div className="text-sm text-gray-500">0/0 correct</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900">0</div>
                      <div className="text-sm text-gray-500">points</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">J</div>
                      <div>
                        <div className="font-medium text-gray-900">jasontipper</div>
                        <div className="text-sm text-gray-500">0/0 correct</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900">0</div>
                      <div className="text-sm text-gray-500">points</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-center text-sm text-gray-500">
                  <p>Showing 2 participants</p>
                  <p>Rankings update after each round</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="hidden md:block max-w-4xl">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Competition Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">2</div>
                    <div className="text-sm text-gray-600">Total Members</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{currentRound}</div>
                    <div className="text-sm text-gray-600">Current Round</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">2025</div>
                    <div className="text-sm text-gray-600">Season</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="hidden md:block max-w-4xl">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Competition Settings</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Competition Code</label>
                      <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">72TLRT</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Scoring System</label>
                      <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">Standard</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center">
                      <input type="checkbox" checked={allowConfidence} disabled className="mr-2" />
                      <span className="text-sm text-gray-700">Allow Confidence Rankings</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" checked={allowMargin} disabled className="mr-2" />
                      <span className="text-sm text-gray-700">Allow Margin Predictions</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Team Detail Modal */}
      {showTeamModal.show && showTeamModal.teamId && (
        <TeamDetailModal 
          teamId={showTeamModal.teamId}
          onClose={() => setShowTeamModal({show: false})}
        />
      )}
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

// Enhanced Game Card Component
interface GameCardProps {
  game: Game
  userTip?: UserTip
  onUpdateTip: (updates: Partial<UserTip>) => void
  allowConfidence: boolean
  isRoundComplete: boolean
  onShowTeamDetail: (teamId: number) => void
}

function GameCard({ game, userTip, onUpdateTip, allowConfidence, isRoundComplete, onShowTeamDetail }: GameCardProps) {
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

      {/* SIDE-BY-SIDE TEAMS FOR MOBILE */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Home Team */}
        <div className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${getBorderColor(game.homeTeamId)}`}
             onClick={() => onShowTeamDetail(game.homeTeamId)}>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TeamLogo teamName={game.homeTeam} size={32} />
            </div>
            <div className="font-semibold text-gray-900 text-sm mb-1">
              {homeTeam?.nickname || game.homeTeam}
            </div>
            <div className="text-xs text-gray-500 mb-2">
              Home • #{homeLadderPos}
            </div>
            
            {/* Score and Form */}
            <div className="space-y-2">
              {isRoundComplete && game.homeScore !== null && (
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {game.homeScore}
                  </div>
                  {actualWinner === game.homeTeamId && (
                    <Trophy className="w-4 h-4 text-yellow-500 mx-auto" />
                  )}
                </div>
              )}
              
              {/* Enhanced Form with Opponents */}
              <div className="flex justify-center gap-1">
                {homeForm.slice(0, 3).map((match, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      match.result === 'W' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    title={`${match.result} vs ${match.opponent}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Away Team */}
        <div className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${getBorderColor(game.awayTeamId)}`}
             onClick={() => onShowTeamDetail(game.awayTeamId)}>
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TeamLogo teamName={game.awayTeam} size={32} />
            </div>
            <div className="font-semibold text-gray-900 text-sm mb-1">
              {awayTeam?.nickname || game.awayTeam}
            </div>
            <div className="text-xs text-gray-500 mb-2">
              Away • #{awayLadderPos}
            </div>
            
            {/* Score and Form */}
            <div className="space-y-2">
              {isRoundComplete && game.awayScore !== null && (
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">
                    {game.awayScore}
                  </div>
                  {actualWinner === game.awayTeamId && (
                    <Trophy className="w-4 h-4 text-yellow-500 mx-auto" />
                  )}
                </div>
              )}
              
              {/* Enhanced Form with Opponents */}
              <div className="flex justify-center gap-1">
                {awayForm.slice(0, 3).map((match, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      match.result === 'W' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    title={`${match.result} vs ${match.opponent}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary for Completed Games */}
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

// Team Detail Modal Component
function TeamDetailModal({ teamId, onClose }: { teamId: number, onClose: () => void }) {
  const team = getTeamById(teamId)
  const teamForm = getTeamForm(teamId)
  const formRecord = getTeamFormRecord(teamId)
  
  if (!team) return null

  // Calculate total games safely
  const totalGames = formRecord.wins + formRecord.losses

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <TeamLogo teamName={team.name} size={40} />
            <div>
              <h3 className="text-lg font-bold text-gray-900">{team.nickname}</h3>
              <p className="text-sm text-gray-500">{team.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Recent Form</h4>
            <div className="text-sm text-gray-600 mb-2">
              Last 5 games: {formRecord.wins}W - {formRecord.losses}L
            </div>
            <div className="space-y-2">
              {teamForm.map((match, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      match.result === 'W' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm">vs {match.opponent}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {match.score}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Current Season Stats</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Ladder Position</div>
                <div className="font-medium">#{LADDER_POSITIONS[teamId] || 'N/A'}</div>
              </div>
              <div>
                <div className="text-gray-600">Win Rate</div>
                <div className="font-medium">
                  {totalGames > 0 ? Math.round((formRecord.wins / totalGames) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <Button
          onClick={onClose}
          className="w-full mt-6"
          variant="outline"
        >
          Close
        </Button>
      </div>
    </div>
  )
}