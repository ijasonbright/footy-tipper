'use client'

import { useState, useEffect } from 'react'
import { Trophy, Medal, Award, TrendingUp, User } from 'lucide-react'

interface LeaderboardEntry {
  userId: string
  username: string
  imageUrl?: string
  totalPoints: number
  correctTips: number
  totalTips: number
  rank: number
  change?: number // Position change from last round
}

interface LeaderboardProps {
  competitionId: string
  currentUserId: string
}

export function Leaderboard({ competitionId, currentUserId }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentRound, setCurrentRound] = useState(1)

  const loadLeaderboard = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/leaderboard?competitionId=${competitionId}&round=${currentRound}`)
      if (response.ok) {
        const data = await response.json()
        setLeaderboard(data.leaderboard || [])
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadLeaderboard()
  }, [competitionId, currentRound])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />
      default:
        return (
          <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
            {rank}
          </div>
        )
    }
  }

  const getChangeIcon = (change?: number) => {
    if (!change) return null
    
    if (change > 0) {
      return (
        <div className="flex items-center text-green-600">
          <TrendingUp className="w-3 h-3 mr-1" />
          <span className="text-xs">+{change}</span>
        </div>
      )
    } else if (change < 0) {
      return (
        <div className="flex items-center text-red-600">
          <TrendingUp className="w-3 h-3 mr-1 rotate-180" />
          <span className="text-xs">{change}</span>
        </div>
      )
    }
    
    return (
      <div className="text-xs text-gray-400">
        —
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600 text-sm">Loading leaderboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900">
              Leaderboard
            </h3>
            <div className="text-sm text-gray-500">
              Round {currentRound}
            </div>
          </div>
        </div>

        {/* Leaderboard List */}
        <div className="divide-y divide-gray-200">
          {leaderboard.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Trophy className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p>No rankings available yet</p>
              <p className="text-sm mt-1">Rankings will appear once tips are submitted</p>
            </div>
          ) : (
            leaderboard.map((entry, index) => (
              <div
                key={entry.userId}
                className={`p-4 md:p-6 hover:bg-gray-50 transition-colors ${
                  entry.userId === currentUserId ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
                    {/* Rank */}
                    <div className="flex-shrink-0">
                      {getRankIcon(entry.rank)}
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                        {entry.imageUrl ? (
                          <img
                            src={entry.imageUrl}
                            alt={entry.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate">
                          {entry.username}
                          {entry.userId === currentUserId && (
                            <span className="ml-2 text-xs text-blue-600 font-normal">(You)</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {entry.correctTips}/{entry.totalTips} correct
                          {entry.totalTips > 0 && (
                            <span className="ml-2">
                              ({Math.round((entry.correctTips / entry.totalTips) * 100)}%)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Points and Change */}
                  <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
                    {/* Position Change */}
                    <div className="hidden sm:block">
                      {getChangeIcon(entry.change)}
                    </div>

                    {/* Points */}
                    <div className="text-right">
                      <div className="text-lg md:text-xl font-bold text-gray-900">
                        {entry.totalPoints}
                      </div>
                      <div className="text-xs text-gray-500">
                        points
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Position Change */}
                <div className="sm:hidden mt-2 flex justify-end">
                  {getChangeIcon(entry.change)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {leaderboard.length > 0 && (
          <div className="p-4 md:p-6 border-t border-gray-200 bg-gray-50">
            <div className="text-center text-sm text-gray-600">
              <p>
                Showing {leaderboard.length} {leaderboard.length === 1 ? 'participant' : 'participants'}
              </p>
              <p className="mt-1">
                Rankings update after each round
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}