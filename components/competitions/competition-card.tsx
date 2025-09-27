'use client'

import Link from 'next/link'
import { Users, Calendar, Trophy, Lock, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CompetitionCardProps {
  competition: {
    id: string
    name: string
    description?: string
    code: string
    season: number
    isActive: boolean
    settings: any
    users: Array<{
      user: {
        username: string
        imageUrl?: string
      }
    }>
    createdAt: Date
  }
  userRole: string
}

export function CompetitionCard({ competition, userRole }: CompetitionCardProps) {
  const settings = competition.settings as any
  const isPrivate = settings?.isPrivate !== false
  const memberCount = competition.users.length

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {competition.name}
            </h3>
            {isPrivate ? (
              <Lock className="w-4 h-4 text-gray-500" />
            ) : (
              <Globe className="w-4 h-4 text-green-500" />
            )}
          </div>
          {competition.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {competition.description}
            </p>
          )}
        </div>
        {userRole === 'admin' && (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
            Admin
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-center">
        <div>
          <Users className="w-4 h-4 text-gray-500 mx-auto mb-1" />
          <p className="text-lg font-semibold text-gray-900">{memberCount}</p>
          <p className="text-xs text-gray-600">Members</p>
        </div>
        <div>
          <Calendar className="w-4 h-4 text-gray-500 mx-auto mb-1" />
          <p className="text-lg font-semibold text-gray-900">{competition.season}</p>
          <p className="text-xs text-gray-600">Season</p>
        </div>
        <div>
          <Trophy className="w-4 h-4 text-gray-500 mx-auto mb-1" />
          <p className="text-lg font-semibold text-gray-900">0</p>
          <p className="text-xs text-gray-600">Your Rank</p>
        </div>
      </div>

      {/* Competition Code */}
      <div className="bg-gray-50 rounded-md p-3 mb-4">
        <p className="text-xs text-gray-600 mb-1">Competition Code</p>
        <p className="font-mono text-sm font-semibold text-gray-900">
          {competition.code}
        </p>
      </div>

      {/* Member Avatars */}
      <div className="flex items-center mb-4">
        <div className="flex -space-x-2">
          {competition.users.slice(0, 4).map((member, index) => (
            <div
              key={index}
              className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center"
            >
              {member.user.imageUrl ? (
                <img
                  src={member.user.imageUrl}
                  alt={member.user.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-xs font-medium text-gray-600">
                  {member.user.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          ))}
          {memberCount > 4 && (
            <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">
                +{memberCount - 4}
              </span>
            </div>
          )}
        </div>
        {memberCount > 0 && (
          <span className="ml-3 text-sm text-gray-600">
            and {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link href={`/competitions/${competition.id}`} className="flex-1">
          <Button className="w-full bg-blue-600 hover:bg-blue-700">
            View Competition
          </Button>
        </Link>
        {userRole === 'admin' && (
          <Link href={`/competitions/${competition.id}/settings`}>
            <Button variant="outline" size="icon">
              <Users className="w-4 h-4" />
            </Button>
          </Link>
        )}
      </div>

      {/* Status */}
      <div className="mt-3 flex justify-between items-center text-xs text-gray-500">
        <span>
          {isPrivate ? 'Private' : 'Public'} • Created {new Date(competition.createdAt).toLocaleDateString()}
        </span>
        <span className={`px-2 py-1 rounded-full ${
          competition.isActive 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {competition.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  )
}
