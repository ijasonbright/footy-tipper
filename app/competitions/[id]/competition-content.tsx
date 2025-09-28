'use client'

import { useState } from 'react'
import { RoleToggle } from '@/components/role-toggle'
import { TippingInterface } from '@/components/tipping-interface'
import { AdminTestingPanel } from '@/components/admin-testing-panel'

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

      {/* Content based on current view */}
      <div className="w-full">
        {currentView === 'admin' ? (
          // ADMIN VIEW - Full admin interface
          <div>
            <AdminTestingPanel competitionId={competitionId} />
            <div className="p-4 max-w-4xl mx-auto">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-yellow-800 mb-2">Admin View Active</h3>
                <p className="text-sm text-yellow-700">
                  You're viewing the admin interface with testing controls and management tools. 
                  Switch to User View to see the clean tipping experience.
                </p>
              </div>
            </div>
            <TippingInterface
              competitionId={competitionId}
              userId={userId}
              competitionSettings={competitionSettings}
            />
          </div>
        ) : (
          // USER VIEW - Clean user experience
          <div>
            <TippingInterface
              competitionId={competitionId}
              userId={userId}
              competitionSettings={competitionSettings}
            />
          </div>
        )}
      </div>
    </div>
  )
}