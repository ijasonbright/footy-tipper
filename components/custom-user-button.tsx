'use client'

import { UserButton } from '@clerk/nextjs'
import { Eye, UserCog, Settings } from 'lucide-react'
import { useUser } from '@clerk/nextjs'
import { useViewMode } from '@/contexts/view-mode-context'

export function CustomUserButton() {
  const { user } = useUser()
  const { viewMode, setViewMode, isAdmin } = useViewMode()

  return (
    <UserButton afterSignOutUrl="/">
      <UserButton.MenuItems>
        {/* Profile Section */}
        <UserButton.Link
          label="Manage account"
          labelIcon={<Settings className="w-4 h-4" />}
          href="/user-profile"
        />
        
        {/* Admin Controls - Only show if user is admin */}
        {isAdmin && (
          <UserButton.Action
            label={`Switch to ${viewMode === 'admin' ? 'User' : 'Admin'} View`}
            labelIcon={
              viewMode === 'admin' ? 
              <Eye className="w-4 h-4" /> : 
              <UserCog className="w-4 h-4" />
            }
            onClick={() => setViewMode(viewMode === 'admin' ? 'user' : 'admin')}
          />
        )}
      </UserButton.MenuItems>
    </UserButton>
  )
}