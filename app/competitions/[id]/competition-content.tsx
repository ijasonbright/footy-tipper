'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Trophy, 
  Users, 
  Settings, 
  Calendar, 
  Target,
  Crown,
  Medal,
  Award,
  Copy,
  Check,
  Share2
} from 'lucide-react'

interface CompetitionContentProps {
  competition: any
  user: any
  userMembership: any
  currentRoundGames: any[]
  userTips: any[]
}

function CompetitionContent({ 
  competition, 
  user, 
  userMembership,
  currentRoundGames,
  userTips 
}: CompetitionContentProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'tipping' | 'settings'>('overview')
  const [codeCopied, setCodeCopied] = useState(false)

  const isAdmin = userMembership.role === 'admin'
  const settings = competition.settings as any

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(competition.code)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const getRankingSuffix = (position: number) => {
    if (position === 1) return 'st'
    if (position === 2) return 'nd'
    if (position === 3) return 'rd'
    return 'th'
  }

  const userPosition = competition.users.findIndex((cu: any) => cu.userId === user.id) + 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <h1 className="text-3xl font-bold text-gray-900">{competition.name}</h1>
              {settings?.isPrivate && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  Private
                </span>
              )}
            </div>
            {competition.description && (
              <p className="text-gray-600 mb-4">{competition.description}</p>
            )}
            
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{competition.users.length} members</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Season {competition.season}</span>
              </div>
              {userPosition && (
                <div className="flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  <span>You're {userPosition}{getRankingSuffix(userPosition)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Competition Code */}
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">Competition Code</div>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                <span className="font-mono text-lg font-bold">{competition.code}</span>
                {codeCopied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>

            {/* Share Button */}
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>

            {/* Settings (Admin only) */}
            {isAdmin && (
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'overview', name: 'Overview', icon: Trophy },
              { id: 'leaderboard', name: 'Leaderboard', icon: Crown },
              { id: 'tipping', name: 'Tipping', icon: Target },
              ...(isAdmin ? [{ id: 'settings', name: 'Settings', icon: Settings }] : [])
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Your Stats */}
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Your Performance</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Current Position:</span>
                      <span className="font-bold text-blue-900">
                        {userPosition}{getRankingSuffix(userPosition)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Total Points:</span>
                      <span className="font-bold text-blue-900">{userMembership.totalPoints}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Joined:</span>
                      <span className="font-bold text-blue-900">
                        {new Date(userMembership.joinedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Competition Stats */}
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900 mb-4">Competition Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-green-700">Total Members:</span>
                      <span className="font-bold text-green-900">{competition.users.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Scoring System:</span>
                      <span className="font-bold text-green-900 capitalize">
                        {settings?.scoringSystem || 'Standard'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Created:</span>
                      <span className="font-bold text-green-900">
                        {new Date(competition.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Current Leader */}
                <div className="bg-yellow-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-4">Current Leader</h3>
                  {competition.users[0] && (
                    <div className="flex items-center gap-3">
                      {competition.users[0].user.imageUrl ? (
                        <img
                          src={competition.users[0].user.imageUrl}
                          alt={competition.users[0].user.username}
                          className="w-12 h-12 rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center">
                          <Crown className="w-6 h-6 text-yellow-600" />
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-yellow-900">
                          {competition.users[0].user.username}
                        </div>
                        <div className="text-yellow-700">
                          {competition.users[0].totalPoints} points
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Activity Placeholder */}
              <div className="bg-gray-50 p-8 rounded-lg text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Tipping Not Yet Available</h3>
                <p className="text-gray-600">
                  Game tipping functionality will be available once the AFL season starts and 
                  game data is integrated.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Competition Leaderboard</h3>
              <div className="space-y-2">
                {competition.users.map((competitionUser: any, index: number) => (
                  <div
                    key={competitionUser.id}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      competitionUser.userId === user.id
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 flex items-center justify-center rounded-full ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-100 text-gray-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-50 text-gray-500'
                      }`}>
                        {index < 3 ? (
                          index === 0 ? <Crown className="w-4 h-4" /> :
                          index === 1 ? <Medal className="w-4 h-4" /> :
                          <Award className="w-4 h-4" />
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </div>
                      
                      {competitionUser.user.imageUrl ? (
                        <img
                          src={competitionUser.user.imageUrl}
                          alt={competitionUser.user.username}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-medium">
                            {competitionUser.user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      
                      <div>
                        <div className="font-medium text-gray-900">
                          {competitionUser.user.username}
                          {competitionUser.role === 'admin' && (
                            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                              Admin
                            </span>
                          )}
                          {competitionUser.userId === user.id && (
                            <span className="ml-2 text-blue-600 text-sm">(You)</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          Joined {new Date(competitionUser.joinedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {competitionUser.totalPoints}
                      </div>
                      <div className="text-sm text-gray-500">points</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tipping' && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-8 rounded-lg text-center">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Tipping Coming Soon</h3>
                <p className="text-gray-600">
                  Game tipping interface will be available when AFL games are loaded. 
                  You'll be able to make your predictions for each round here.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && isAdmin && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-8 rounded-lg text-center">
                <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Competition Settings</h3>
                <p className="text-gray-600">
                  Competition management and settings panel will be implemented here.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export { CompetitionContent }
export default CompetitionContent