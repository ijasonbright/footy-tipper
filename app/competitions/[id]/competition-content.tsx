'use client'

import { useState } from 'react'
import { RoleToggle } from '@/components/role-toggle'
import { TippingInterface } from '@/components/tipping-interface'
import { AdminTestingPanel } from '@/components/admin-testing-panel'
import { Leaderboard } from '@/components/leaderboard'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  Trophy, 
  Target, 
  Settings,
  Menu,
  X
} from 'lucide-react'

interface CompetitionContentProps {
  competitionId: string
  userId: string
  userRole: 'admin' | 'member'
  competitionSettings: {
    allowConfidence?: boolean
    allowMargin?: boolean
    scoringSystem?: string
  }
  competition: {
    name: string
    code: string
    season: number
    memberCount: number
  }
}

export function CompetitionContent({ 
  competitionId, 
  userId, 
  userRole,
  competitionSettings,
  competition 
}: CompetitionContentProps) {
  // View state: 'user' or 'admin'
  const [currentView, setCurrentView] = useState<'user' | 'admin'>('user')
  const [activeTab, setActiveTab] = useState('tipping')
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'tipping', label: 'Tipping', icon: Target },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="p-4 md:p-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Competition Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{competition.memberCount}</div>
                  <div className="text-sm text-gray-600">Members</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{competition.season}</div>
                  <div className="text-sm text-gray-600">Season</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">1st</div>
                  <div className="text-sm text-gray-600">Your Position</div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Competition Code</h4>
                <div className="font-mono text-lg font-bold text-gray-900">{competition.code}</div>
                <p className="text-sm text-gray-600 mt-1">Share this code with friends to invite them</p>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium mb-2 text-yellow-800">Competition Settings</h4>
                <div className="space-y-1 text-sm text-yellow-700">
                  <div>Scoring System: {competitionSettings.scoringSystem || 'Standard'}</div>
                  <div>Confidence Points: {competitionSettings.allowConfidence ? 'Enabled' : 'Disabled'}</div>
                  <div>Margin Predictions: {competitionSettings.allowMargin ? 'Enabled' : 'Disabled'}</div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'leaderboard':
        return (
          <Leaderboard 
            competitionId={competitionId}
            currentUserId={userId}
          />
        )

      case 'tipping':
        return (
          <div>
            {/* Admin Panel - Only show to admins in admin view */}
            {userRole === 'admin' && currentView === 'admin' && (
              <AdminTestingPanel competitionId={competitionId} />
            )}
            
            {/* User Tipping Interface - Show to everyone */}
            <TippingInterface
              competitionId={competitionId}
              userId={userId}
              competitionSettings={competitionSettings}
            />
          </div>
        )

      case 'settings':
        return (
          <div className="p-4 md:p-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Competition Name
                  </label>
                  <input
                    type="text"
                    value={competition.name}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Competition Code
                  </label>
                  <input
                    type="text"
                    value={competition.code}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scoring System
                  </label>
                  <select
                    disabled
                    value={competitionSettings.scoringSystem || 'standard'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  >
                    <option value="standard">Standard</option>
                    <option value="confidence">Confidence</option>
                    <option value="margin">Margin Bonus</option>
                  </select>
                </div>
                
                {userRole === 'admin' && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="font-medium mb-2">Admin Settings</h4>
                    <p className="text-sm text-gray-600">
                      Advanced competition management settings would appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Role Toggle - Only for admins */}
      <RoleToggle 
        userRole={userRole}
        currentView={currentView}
        onViewChange={setCurrentView}
      />

      {/* Competition Header */}
      <div className="bg-white border-b border-gray-200 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {competition.name}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span>Season {competition.season}</span>
                <span>•</span>
                <span>{competition.memberCount} members</span>
                <span>•</span>
                <span>Code: <span className="font-mono font-semibold">{competition.code}</span></span>
              </div>
            </div>
            
            {currentView === 'admin' && (
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  Admin Mode
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {tabs.find(tab => tab.id === activeTab)?.label || 'Competition'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="border-t border-gray-200 bg-white">
            <div className="grid grid-cols-2 gap-2 p-4">
              {tabs.map(tab => {
                const Icon = tab.icon
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    onClick={() => {
                      setActiveTab(tab.id)
                      setIsMenuOpen(false)
                    }}
                    className="flex items-center gap-2 justify-start"
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </Button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:block bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex space-x-8">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="w-full">
        {renderTabContent()}
      </div>
    </div>
  )
}