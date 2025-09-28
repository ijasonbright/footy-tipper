'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useViewMode } from '@/contexts/view-mode-context'

interface UseAdminStatusProps {
  competitionId: string
}

export function useAdminStatus({ competitionId }: UseAdminStatusProps) {
  const { user } = useUser()
  const { setIsAdmin } = useViewMode()

  useEffect(() => {
    // Check if user is admin of this competition
    // This would typically involve checking the database
    const checkAdminStatus = async () => {
      if (!user) return

      try {
        const response = await fetch(`/api/competitions/${competitionId}/members`)
        const data = await response.json()
        
        // Find the current user in the competition members
        const userMembership = data.members?.find((member: any) => 
          member.userId === user.id
        )
        
        const isCompetitionAdmin = userMembership?.role === 'admin'
        setIsAdmin(isCompetitionAdmin)
      } catch (error) {
        console.error('Error checking admin status:', error)
        setIsAdmin(false)
      }
    }

    checkAdminStatus()
  }, [user, competitionId, setIsAdmin])
}

// For testing/demo purposes, you can also manually set admin status
export function useSetAdminForTesting(isAdmin: boolean) {
  const { setIsAdmin } = useViewMode()
  
  useEffect(() => {
    setIsAdmin(isAdmin)
  }, [isAdmin, setIsAdmin])
}
