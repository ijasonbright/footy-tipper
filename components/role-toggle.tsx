'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Shield, 
  User, 
  Eye,
  Settings,
  Target
} from 'lucide-react'

interface RoleToggleProps {
  userRole: 'admin' | 'member'
  currentView: 'user' | 'admin'
  onViewChange: (view: 'user' | 'admin') => void
}

export function RoleToggle({ userRole, currentView, onViewChange }: RoleToggleProps) {
  // Only show toggle to admins
  if (userRole !== 'admin') {
    return null
  }

  return (
    <div className="bg-white border-b border-gray-200 p-3 md:p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Admin Access</span>
            </div>
            
            <div className="h-4 border-l border-gray-300"></div>
            
            <div className="text-xs text-gray-600">
              Switch between views:
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => onViewChange('user')}
              variant={currentView === 'user' ? 'default' : 'outline'}
              size="sm"
              className="flex items-center gap-2"
            >
              <User className="w-3 h-3" />
              <span className="hidden sm:inline">User View</span>
            </Button>
            
            <Button
              onClick={() => onViewChange('admin')}
              variant={currentView === 'admin' ? 'default' : 'outline'}
              size="sm"
              className="flex items-center gap-2"
            >
              <Settings className="w-3 h-3" />
              <span className="hidden sm:inline">Admin View</span>
            </Button>
          </div>
        </div>

        {/* View Description */}
        <div className="mt-2 text-xs text-gray-500">
          {currentView === 'user' ? (
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              Viewing as regular user - clean tipping experience
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              Admin view - with management controls and testing tools
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
