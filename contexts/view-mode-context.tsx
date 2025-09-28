'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

type ViewMode = 'user' | 'admin'

interface ViewModeContextType {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  isAdmin: boolean
  setIsAdmin: (admin: boolean) => void
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined)

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>('user')
  const [isAdmin, setIsAdmin] = useState(false)

  return (
    <ViewModeContext.Provider value={{
      viewMode,
      setViewMode,
      isAdmin,
      setIsAdmin
    }}>
      {children}
    </ViewModeContext.Provider>
  )
}

export function useViewMode() {
  const context = useContext(ViewModeContext)
  if (context === undefined) {
    throw new Error('useViewMode must be used within a ViewModeProvider')
  }
  return context
}
