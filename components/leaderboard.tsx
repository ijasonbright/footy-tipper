'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Trophy, Medal, Award, Users } from 'lucide-react'

interface UserStanding {
  userId: string
  username: string
  imageUrl?: string
  totalPoints: number
  correctTips: number
  totalTips: number
  percentage: number
  totalMarginDiff: number
  roundBreakdown: RoundResult[]
  position: number
}

interface RoundResult {
  round: number
  points: number
  correctTips: number
  totalGames: number
  allCorrectBonus: number
  marginDiff: number
}

interface CompetitionSettings {
  correctTipPoints: number
  allCorrectBonus: boolean
  allCorrectBonusPoints: number
  marginMode: 'none' | 'all' | 'first'
  marginBonusEnabled: boolean
  marginBonusThreshold: number
  marginBonusPoints: number
  confidenceEnabled: boolean
  confidenceMultiplier: number
}

interface LeaderboardProps {
  competitionId: string
  currentUserId?: string
  currentRound?: number
  isAdmin?: boolean
}

export function Leaderboard({ competitionId, currentUserId, currentRound, isAdmin = false }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<UserStanding[]>([])
  const [settings, setSettings] = useState<CompetitionSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedRound, setSelectedRound] = useState<number | null>(null)
  const [roundSummaries, setRoundSummaries] = useState<any[]>([])

  useEffect(() => {
    loadLeaderboard()
  }, [competitionId, selectedRound])

  const loadLeaderboard = async () => {
    setLoading(true)
    try {
      const url = selectedRound 
        ? `/api/competitions/${competitionId}/leaderboard?round=${selectedRound}`
        : `/api/competitions/${competitionId}/leaderboard`
      
      const response = await fetch(url)
      const data = await response.json()

      if (response.ok) {
        setLeaderboard(data.leaderboard || [])
        setSettings(data.settings)
        if (data.roundSummaries) {
          setRoundSummaries(data.roundSummaries)
        }
      } else {
        console.error('Failed to load leaderboard:', data.error)
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    }
    setLoading(false)
  }

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-500">#{position}</span>
    }
  }

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600 bg-green-50'
    if (percentage >= 60) return 'text-blue-600 bg-blue-50'
    if (percentage >= 40) return 'text-orange-600 bg-orange-50'
    return 'text-red-600 bg-red-50'
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header with Round Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedRound ? `Round ${selectedRound} Leaderboard` : 'Overall Leaderboard'}
            </h2>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={() => setSelectedRound(null)}
              variant={selectedRound === null ? "default" : "outline"}
              size="sm"
            >
              Overall
            </Button>
            
            {roundSummaries.slice(0, 5).map(summary => (
              <Button
                key={summary.round}
                onClick={() => setSelectedRound(summary.round)}
                variant={selectedRound === summary.round ? "default" : "outline"}
                size="sm"
              >
                R{summary.round}
              </Button>
            ))}
          </div>
        </div>

        {/* Competition Settings Display */}
        {settings && (
          <div className="flex flex-wrap gap-2 text-xs text-gray-600">
            <span className="px-2 py-1 bg-gray-100 rounded">
              {settings.correctTipPoints} point{settings.correctTipPoints !== 1 ? 's' : ''} per correct tip
            </span>
            {settings.allCorrectBonus && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                +{settings.allCorrectBonusPoints} all correct bonus
              </span>
            )}
            {settings.marginBonusEnabled && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                +{settings.marginBonusPoints} margin bonus (±{settings.marginBonusThreshold})
              </span>
            )}
            {settings.confidenceEnabled && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                Confidence multiplier
              </span>
            )}
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {leaderboard.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="font-medium">No completed tips yet</p>
            <p className="text-sm mt-1">Results will appear after games are completed</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {leaderboard.map((user) => (
              <div 
                key={user.userId} 
                className={`p-4 transition-colors ${
                  user.position <= 3 ? 'bg-gradient-to-r from-yellow-50 to-transparent' : ''
                } ${user.userId === currentUserId ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10">
                      {getPositionIcon(user.position)}
                    </div>

                    <div className="flex items-center gap-3">
                      {user.imageUrl ? (
                        <img
                          src={user.imageUrl}
                          alt={user.username}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{user.username}</span>
                          {user.userId === currentUserId && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">You</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.correctTips}/{user.totalTips} correct
                          {user.totalMarginDiff > 0 && (
                            <span className="ml-2">• {user.totalMarginDiff} margin diff</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={`px-2 py-1 rounded text-sm font-medium ${getPerformanceColor(user.percentage)}`}>
                      {user.percentage.toFixed(1)}%
                    </div>

                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900">{user.totalPoints}</div>
                      <div className="text-xs text-gray-500">points</div>
                    </div>
                  </div>
                </div>

                {selectedRound === null && user.roundBreakdown.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex gap-2 flex-wrap">
                      {user.roundBreakdown.map(round => (
                        <div
                          key={round.round}
                          className="px-2 py-1 bg-gray-100 rounded text-xs"
                          title={`Round ${round.round}: ${round.correctTips}/${round.totalGames} correct`}
                        >
                          R{round.round}: {round.points}pts
                          {round.allCorrectBonus > 0 && (
                            <span className="text-green-600 font-medium"> +{round.allCorrectBonus}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Round Summaries */}
      {selectedRound === null && roundSummaries.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Round Summaries</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roundSummaries.map(summary => (
              <div key={summary.round} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">Round {summary.round}</span>
                  <Button
                    onClick={() => setSelectedRound(summary.round)}
                    variant="outline"
                    size="sm"
                  >
                    View
                  </Button>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div>{summary.completedGames}/{summary.totalGames} games completed</div>
                  <div>{summary.participants} participants</div>
                  <div>Avg: {summary.averageScore.toFixed(1)} points</div>
                  {summary.perfectRounds > 0 && (
                    <div className="text-green-600 font-medium">
                      {summary.perfectRounds} perfect round{summary.perfectRounds !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Leaderboard
