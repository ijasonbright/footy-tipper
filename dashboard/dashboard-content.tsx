'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, Users, Trophy, Calendar, Settings } from 'lucide-react'
import { CreateCompetitionModal } from '@/components/competitions/create-competition-modal'
import { JoinCompetitionModal } from '@/components/competitions/join-competition-modal'
import { CompetitionCard } from '@/components/competitions/competition-card'

interface DashboardContentProps {
  user: any
  competitions: any[]
}

export function DashboardContent({ user, competitions }: DashboardContentProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user.firstName || user.username}!
        </h1>
        <p className="text-gray-600">
          Manage your AFL tipping competitions and track your performance.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <Trophy className="w-8 h-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{competitions.length}</p>
              <p className="text-sm text-gray-600">Competitions</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {competitions.reduce((acc, comp) => acc + comp.competition.users.length, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Members</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-sm text-gray-600">Tips This Round</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <Settings className="w-8 h-8 text-purple-500 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-sm text-gray-600">Total Points</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create Competition
        </Button>
        
        <Button 
          onClick={() => setShowJoinModal(true)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          Join Competition
        </Button>
      </div>

      {/* Competitions Grid */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Your Competitions</h2>
        
        {competitions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md border border-gray-200">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No competitions yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first competition or join an existing one to get started!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Create Competition
              </Button>
              <Button 
                onClick={() => setShowJoinModal(true)}
                variant="outline"
              >
                Join Competition
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competitions.map((userComp) => (
              <CompetitionCard 
                key={userComp.competition.id}
                competition={userComp.competition}
                userRole={userComp.role}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateCompetitionModal 
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
      
      <JoinCompetitionModal 
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
      />
    </>
  )
}
