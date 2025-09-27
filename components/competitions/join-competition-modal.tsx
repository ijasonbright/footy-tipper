'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { X, Search, Lock, Globe, Users, Calendar } from 'lucide-react'

interface JoinCompetitionModalProps {
  isOpen: boolean
  onClose: () => void
}

export function JoinCompetitionModal({ isOpen, onClose }: JoinCompetitionModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [searchMode, setSearchMode] = useState<'code' | 'browse'>('code')
  const [competitionCode, setCompetitionCode] = useState('')
  const [publicCompetitions, setPublicCompetitions] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  if (!isOpen) return null

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/competitions/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: competitionCode.toUpperCase() }),
      })

      if (response.ok) {
        const competition = await response.json()
        router.push(`/competitions/${competition.id}`)
        router.refresh()
        onClose()
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to join competition')
      }
    } catch (error) {
      console.error('Error joining competition:', error)
      alert('Failed to join competition. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBrowsePublic = async () => {
    setSearchLoading(true)
    try {
      const response = await fetch('/api/competitions/public')
      if (response.ok) {
        const competitions = await response.json()
        setPublicCompetitions(competitions)
      }
    } catch (error) {
      console.error('Error fetching public competitions:', error)
    } finally {
      setSearchLoading(false)
    }
  }

  const handleJoinPublic = async (competitionId: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/competitions/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ competitionId }),
      })

      if (response.ok) {
        const competition = await response.json()
        router.push(`/competitions/${competition.id}`)
        router.refresh()
        onClose()
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to join competition')
      }
    } catch (error) {
      console.error('Error joining competition:', error)
      alert('Failed to join competition. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Join Competition</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                searchMode === 'code'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setSearchMode('code')}
            >
              Join by Code
            </button>
            <button
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                searchMode === 'browse'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => {
                setSearchMode('browse')
                if (publicCompetitions.length === 0) {
                  handleBrowsePublic()
                }
              }}
            >
              Browse Public
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {searchMode === 'code' ? (
            /* Join by Code */
            <div className="space-y-6">
              <div className="text-center">
                <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Join Private Competition
                </h3>
                <p className="text-gray-600">
                  Enter the 6-character competition code to join a private competition.
                </p>
              </div>

              <form onSubmit={handleJoinByCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Competition Code
                  </label>
                  <input
                    type="text"
                    required
                    value={competitionCode}
                    onChange={(e) => setCompetitionCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    pattern="[A-Z0-9]{6}"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono tracking-wider"
                    placeholder="ABC123"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the 6-character code shared by the competition admin
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading || competitionCode.length !== 6}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? 'Joining...' : 'Join Competition'}
                </Button>
              </form>
            </div>
          ) : (
            /* Browse Public */
            <div className="space-y-6">
              <div className="text-center">
                <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Public Competitions
                </h3>
                <p className="text-gray-600">
                  Join any public competition that's open to everyone.
                </p>
              </div>

              {searchLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading competitions...</p>
                </div>
              ) : publicCompetitions.length === 0 ? (
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No public competitions found.</p>
                  <Button
                    onClick={handleBrowsePublic}
                    variant="outline"
                    className="mt-4"
                  >
                    Refresh
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {publicCompetitions.map((competition) => (
                    <div
                      key={competition.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">
                            {competition.name}
                          </h4>
                          {competition.description && (
                            <p className="text-sm text-gray-600 mb-2">
                              {competition.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {competition._count?.users || 0} members
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {competition.season} season
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleJoinPublic(competition.id)}
                          disabled={loading}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Join
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <p className="text-xs text-gray-600 text-center">
            Need help? Contact the competition admin or check your invitation for the correct code.
          </p>
        </div>
      </div>
    </div>
  )
}
