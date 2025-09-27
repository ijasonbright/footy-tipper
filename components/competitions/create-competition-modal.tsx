'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { X, Lock, Globe, Users, Trophy } from 'lucide-react'
import { generateCompetitionCode } from '@/lib/utils'

interface CreateCompetitionModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateCompetitionModal({ isOpen, onClose }: CreateCompetitionModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: true,
    scoringSystem: 'standard',
    allowConfidence: false,
    allowMargin: false
  })

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/competitions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          code: generateCompetitionCode(),
        }),
      })

      if (response.ok) {
        const competition = await response.json()
        router.push(`/competitions/${competition.id}`)
        router.refresh()
        onClose()
      } else {
        throw new Error('Failed to create competition')
      }
    } catch (error) {
      console.error('Error creating competition:', error)
      alert('Failed to create competition. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Competition</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Details</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Competition Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Friday Night Footy Tips"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Optional description for your competition..."
              />
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Privacy Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  formData.isPrivate 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, isPrivate: true }))}
              >
                <div className="flex items-center mb-2">
                  <Lock className="w-5 h-5 text-gray-600 mr-2" />
                  <span className="font-medium text-gray-900">Private</span>
                </div>
                <p className="text-sm text-gray-600">
                  Only people with the competition code can join
                </p>
              </div>

              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  !formData.isPrivate 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setFormData(prev => ({ ...prev, isPrivate: false }))}
              >
                <div className="flex items-center mb-2">
                  <Globe className="w-5 h-5 text-gray-600 mr-2" />
                  <span className="font-medium text-gray-900">Public</span>
                </div>
                <p className="text-sm text-gray-600">
                  Anyone can find and join this competition
                </p>
              </div>
            </div>
          </div>

          {/* Scoring Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Scoring Options</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scoring System
              </label>
              <select
                value={formData.scoringSystem}
                onChange={(e) => setFormData(prev => ({ ...prev, scoringSystem: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="standard">Standard (1 point per correct tip)</option>
                <option value="confidence">Confidence (multiply by confidence ranking)</option>
                <option value="margin">Margin bonus (bonus for close margin predictions)</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.allowConfidence}
                  onChange={(e) => setFormData(prev => ({ ...prev, allowConfidence: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Allow confidence ranking (1-9 for each tip)
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.allowMargin}
                  onChange={(e) => setFormData(prev => ({ ...prev, allowMargin: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Allow margin predictions
                </span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Creating...' : 'Create Competition'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
