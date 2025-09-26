import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwindcss-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting utilities
export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-AU', {
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatShortDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-AU', {
    month: 'short',
    day: 'numeric'
  })
}

// Competition code generation
export function generateCompetitionCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Validation utilities
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidCompetitionCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code)
}

// Number formatting
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-AU').format(num)
}

export function formatPercentage(num: number, decimals: number = 1): string {
  return `${num.toFixed(decimals)}%`
}

// Array utilities
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export function groupBy<T, K extends keyof any>(
  array: T[],
  key: (item: T) => K
): Record<K, T[]> {
  return array.reduce((groups, item) => {
    const group = key(item)
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(item)
    return groups
  }, {} as Record<K, T[]>)
}

// Sleep utility for testing
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Local storage utilities (for client-side only)
export function getLocalStorage(key: string, defaultValue: any = null) {
  if (typeof window === 'undefined') return defaultValue
  
  try {
    const item = window.localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Error reading localStorage key "${key}":`, error)
    return defaultValue
  }
}

export function setLocalStorage(key: string, value: any) {
  if (typeof window === 'undefined') return
  
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error)
  }
}

// Error handling
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

// AFL-specific utilities
export const AFL_TEAMS = [
  { id: 1, name: 'Adelaide', nickname: 'Crows', abbrev: 'ADE' },
  { id: 2, name: 'Brisbane Lions', nickname: 'Lions', abbrev: 'BRL' },
  { id: 3, name: 'Carlton', nickname: 'Blues', abbrev: 'CAR' },
  { id: 4, name: 'Collingwood', nickname: 'Magpies', abbrev: 'COL' },
  { id: 5, name: 'Essendon', nickname: 'Bombers', abbrev: 'ESS' },
  { id: 6, name: 'Fremantle', nickname: 'Dockers', abbrev: 'FRE' },
  { id: 7, name: 'Geelong', nickname: 'Cats', abbrev: 'GEE' },
  { id: 8, name: 'Gold Coast', nickname: 'Suns', abbrev: 'GCS' },
  { id: 9, name: 'GWS', nickname: 'Giants', abbrev: 'GWS' },
  { id: 10, name: 'Hawthorn', nickname: 'Hawks', abbrev: 'HAW' },
  { id: 11, name: 'Melbourne', nickname: 'Demons', abbrev: 'MEL' },
  { id: 12, name: 'North Melbourne', nickname: 'Kangaroos', abbrev: 'NTH' },
  { id: 13, name: 'Port Adelaide', nickname: 'Power', abbrev: 'POR' },
  { id: 14, name: 'Richmond', nickname: 'Tigers', abbrev: 'RIC' },
  { id: 15, name: 'St Kilda', nickname: 'Saints', abbrev: 'STK' },
  { id: 16, name: 'Sydney', nickname: 'Swans', abbrev: 'SYD' },
  { id: 17, name: 'West Coast', nickname: 'Eagles', abbrev: 'WCE' },
  { id: 18, name: 'Western Bulldogs', nickname: 'Bulldogs', abbrev: 'WBD' },
] as const

export function getTeamById(id: number) {
  return AFL_TEAMS.find(team => team.id === id)
}

export function getTeamByName(name: string) {
  return AFL_TEAMS.find(team => 
    team.name.toLowerCase() === name.toLowerCase() ||
    team.nickname.toLowerCase() === name.toLowerCase() ||
    team.abbrev.toLowerCase() === name.toLowerCase()
  )
}
