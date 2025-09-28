// Mock AFL game data for testing during off-season
export interface MockGame {
  id: string
  squiggleId: string
  round: number
  season: number
  homeTeam: string
  awayTeam: string
  homeTeamId: number
  awayTeamId: number
  venue: string
  date: Date
  homeScore: number | null
  awayScore: number | null
  winner: number | null
  isComplete: boolean
  createdAt: Date
  updatedAt: Date
}

// AFL Teams with correct IDs, logos, and colors matching Squiggle API
export const AFL_TEAMS = [
  { 
    id: 1, 
    name: 'Adelaide', 
    nickname: 'Crows', 
    abbrev: 'ADE',
    primaryColor: '#003366',
    secondaryColor: '#FFCC00',
    logo: 'https://squiggle.com.au/static/logos/ade.png'
  },
  { 
    id: 2, 
    name: 'Brisbane Lions', 
    nickname: 'Lions', 
    abbrev: 'BRL',
    primaryColor: '#722F37',
    secondaryColor: '#FFC72C',
    logo: 'https://squiggle.com.au/static/logos/brl.png'
  },
  { 
    id: 3, 
    name: 'Carlton', 
    nickname: 'Blues', 
    abbrev: 'CAR',
    primaryColor: '#001F3E',
    secondaryColor: '#FFFFFF',
    logo: 'https://squiggle.com.au/static/logos/car.png'
  },
  { 
    id: 4, 
    name: 'Collingwood', 
    nickname: 'Magpies', 
    abbrev: 'COL',
    primaryColor: '#000000',
    secondaryColor: '#FFFFFF',
    logo: 'https://squiggle.com.au/static/logos/col.png'
  },
  { 
    id: 5, 
    name: 'Essendon', 
    nickname: 'Bombers', 
    abbrev: 'ESS',
    primaryColor: '#C41E3A',
    secondaryColor: '#000000',
    logo: 'https://squiggle.com.au/static/logos/ess.png'
  },
  { 
    id: 6, 
    name: 'Fremantle', 
    nickname: 'Dockers', 
    abbrev: 'FRE',
    primaryColor: '#2E1A47',
    secondaryColor: '#00D4AA',
    logo: 'https://squiggle.com.au/static/logos/fre.png'
  },
  { 
    id: 7, 
    name: 'Geelong', 
    nickname: 'Cats', 
    abbrev: 'GEE',
    primaryColor: '#1E3A8A',
    secondaryColor: '#FFFFFF',
    logo: 'https://squiggle.com.au/static/logos/gee.png'
  },
  { 
    id: 8, 
    name: 'Gold Coast', 
    nickname: 'Suns', 
    abbrev: 'GCS',
    primaryColor: '#B41E3A',
    secondaryColor: '#FFD100',
    logo: 'https://squiggle.com.au/static/logos/gcs.png'
  },
  { 
    id: 9, 
    name: 'GWS', 
    nickname: 'Giants', 
    abbrev: 'GWS',
    primaryColor: '#FF6600',
    secondaryColor: '#333333',
    logo: 'https://squiggle.com.au/static/logos/gws.png'
  },
  { 
    id: 10, 
    name: 'Hawthorn', 
    nickname: 'Hawks', 
    abbrev: 'HAW',
    primaryColor: '#4D2004',
    secondaryColor: '#FFD100',
    logo: 'https://squiggle.com.au/static/logos/haw.png'
  },
  { 
    id: 11, 
    name: 'Melbourne', 
    nickname: 'Demons', 
    abbrev: 'MEL',
    primaryColor: '#0F1419',
    secondaryColor: '#FF0000',
    logo: 'https://squiggle.com.au/static/logos/mel.png'
  },
  { 
    id: 12, 
    name: 'North Melbourne', 
    nickname: 'Kangaroos', 
    abbrev: 'NTH',
    primaryColor: '#003F7F',
    secondaryColor: '#FFFFFF',
    logo: 'https://squiggle.com.au/static/logos/nth.png'
  },
  { 
    id: 13, 
    name: 'Port Adelaide', 
    nickname: 'Power', 
    abbrev: 'POR',
    primaryColor: '#00B2A9',
    secondaryColor: '#000000',
    logo: 'https://squiggle.com.au/static/logos/por.png'
  },
  { 
    id: 14, 
    name: 'Richmond', 
    nickname: 'Tigers', 
    abbrev: 'RIC',
    primaryColor: '#FFFF00',
    secondaryColor: '#000000',
    logo: 'https://squiggle.com.au/static/logos/ric.png'
  },
  { 
    id: 15, 
    name: 'St Kilda', 
    nickname: 'Saints', 
    abbrev: 'STK',
    primaryColor: '#A41E22',
    secondaryColor: '#000000',
    logo: 'https://squiggle.com.au/static/logos/stk.png'
  },
  { 
    id: 16, 
    name: 'Sydney', 
    nickname: 'Swans', 
    abbrev: 'SYD',
    primaryColor: '#ED1C24',
    secondaryColor: '#FFFFFF',
    logo: 'https://squiggle.com.au/static/logos/syd.png'
  },
  { 
    id: 17, 
    name: 'West Coast', 
    nickname: 'Eagles', 
    abbrev: 'WCE',
    primaryColor: '#003F7F',
    secondaryColor: '#FFD100',
    logo: 'https://squiggle.com.au/static/logos/wce.png'
  },
  { 
    id: 18, 
    name: 'Western Bulldogs', 
    nickname: 'Bulldogs', 
    abbrev: 'WBD',
    primaryColor: '#E31837',
    secondaryColor: '#003F7F',
    logo: 'https://squiggle.com.au/static/logos/wbd.png'
  },
] as const

// Team form data (last 5 games) - mock data for testing
export const TEAM_FORM: Record<number, Array<{opponent: string, result: 'W' | 'L', score: string}>> = {
  1: [ // Adelaide
    { opponent: 'SYD', result: 'L', score: '82-95' },
    { opponent: 'GEE', result: 'W', score: '108-89' },
    { opponent: 'CAR', result: 'L', score: '76-102' },
    { opponent: 'ESS', result: 'W', score: '115-87' },
    { opponent: 'POR', result: 'L', score: '91-98' }
  ],
  2: [ // Brisbane Lions
    { opponent: 'MEL', result: 'W', score: '125-78' },
    { opponent: 'COL', result: 'W', score: '99-88' },
    { opponent: 'GWS', result: 'W', score: '112-85' },
    { opponent: 'HAW', result: 'L', score: '89-94' },
    { opponent: 'FRE', result: 'W', score: '103-91' }
  ],
  3: [ // Carlton
    { opponent: 'RIC', result: 'W', score: '118-102' },
    { opponent: 'ADE', result: 'W', score: '102-76' },
    { opponent: 'WCE', result: 'W', score: '125-89' },
    { opponent: 'STK', result: 'L', score: '85-92' },
    { opponent: 'NTH', result: 'W', score: '145-67' }
  ],
  4: [ // Collingwood
    { opponent: 'BRL', result: 'L', score: '88-99' },
    { opponent: 'GEE', result: 'W', score: '95-87' },
    { opponent: 'MEL', result: 'L', score: '78-89' },
    { opponent: 'SYD', result: 'W', score: '102-98' },
    { opponent: 'ESS', result: 'W', score: '108-91' }
  ],
  5: [ // Essendon
    { opponent: 'HAW', result: 'W', score: '112-89' },
    { opponent: 'WBD', result: 'L', score: '76-88' },
    { opponent: 'GCS', result: 'W', score: '125-78' },
    { opponent: 'ADE', result: 'L', score: '87-115' },
    { opponent: 'COL', result: 'L', score: '91-108' }
  ],
  6: [ // Fremantle
    { opponent: 'WCE', result: 'W', score: '89-76' },
    { opponent: 'POR', result: 'L', score: '82-95' },
    { opponent: 'BRL', result: 'L', score: '91-103' },
    { opponent: 'GWS', result: 'W', score: '98-87' },
    { opponent: 'STK', result: 'W', score: '112-85' }
  ],
  7: [ // Geelong
    { opponent: 'ADE', result: 'L', score: '89-108' },
    { opponent: 'COL', result: 'L', score: '87-95' },
    { opponent: 'MEL', result: 'W', score: '115-102' },
    { opponent: 'CAR', result: 'W', score: '98-91' },
    { opponent: 'HAW', result: 'W', score: '125-89' }
  ],
  8: [ // Gold Coast
    { opponent: 'NTH', result: 'W', score: '125-76' },
    { opponent: 'STK', result: 'L', score: '82-95' },
    { opponent: 'ESS', result: 'L', score: '78-125' },
    { opponent: 'WBD', result: 'W', score: '102-88' },
    { opponent: 'RIC', result: 'L', score: '85-98' }
  ],
  9: [ // GWS
    { opponent: 'BRL', result: 'L', score: '85-112' },
    { opponent: 'FRE', result: 'L', score: '87-98' },
    { opponent: 'POR', result: 'W', score: '108-91' },
    { opponent: 'WCE', result: 'W', score: '115-89' },
    { opponent: 'MEL', result: 'L', score: '78-102' }
  ],
  10: [ // Hawthorn
    { opponent: 'ESS', result: 'L', score: '89-112' },
    { opponent: 'BRL', result: 'W', score: '94-89' },
    { opponent: 'GEE', result: 'L', score: '89-125' },
    { opponent: 'NTH', result: 'W', score: '125-78' },
    { opponent: 'SYD', result: 'L', score: '85-98' }
  ],
  11: [ // Melbourne
    { opponent: 'BRL', result: 'L', score: '78-125' },
    { opponent: 'COL', result: 'W', score: '89-78' },
    { opponent: 'GEE', result: 'L', score: '102-115' },
    { opponent: 'GWS', result: 'W', score: '102-78' },
    { opponent: 'WBD', result: 'W', score: '112-89' }
  ],
  12: [ // North Melbourne
    { opponent: 'GCS', result: 'L', score: '76-125' },
    { opponent: 'CAR', result: 'L', score: '67-145' },
    { opponent: 'HAW', result: 'L', score: '78-125' },
    { opponent: 'WCE', result: 'L', score: '82-108' },
    { opponent: 'STK', result: 'L', score: '76-95' }
  ],
  13: [ // Port Adelaide
    { opponent: 'FRE', result: 'W', score: '95-82' },
    { opponent: 'GWS', result: 'L', score: '91-108' },
    { opponent: 'ADE', result: 'W', score: '98-91' },
    { opponent: 'RIC', result: 'W', score: '115-89' },
    { opponent: 'WBD', result: 'L', score: '85-98' }
  ],
  14: [ // Richmond
    { opponent: 'CAR', result: 'L', score: '102-118' },
    { opponent: 'POR', result: 'L', score: '89-115' },
    { opponent: 'GCS', result: 'W', score: '98-85' },
    { opponent: 'STK', result: 'W', score: '125-89' },
    { opponent: 'WCE', result: 'L', score: '76-102' }
  ],
  15: [ // St Kilda
    { opponent: 'GCS', result: 'W', score: '95-82' },
    { opponent: 'CAR', result: 'W', score: '92-85' },
    { opponent: 'FRE', result: 'L', score: '85-112' },
    { opponent: 'RIC', result: 'L', score: '89-125' },
    { opponent: 'NTH', result: 'W', score: '95-76' }
  ],
  16: [ // Sydney
    { opponent: 'ADE', result: 'W', score: '95-82' },
    { opponent: 'COL', result: 'L', score: '98-102' },
    { opponent: 'HAW', result: 'W', score: '98-85' },
    { opponent: 'WBD', result: 'W', score: '115-89' },
    { opponent: 'WCE', result: 'W', score: '125-78' }
  ],
  17: [ // West Coast
    { opponent: 'FRE', result: 'L', score: '76-89' },
    { opponent: 'CAR', result: 'L', score: '89-125' },
    { opponent: 'GWS', result: 'L', score: '89-115' },
    { opponent: 'NTH', result: 'W', score: '108-82' },
    { opponent: 'SYD', result: 'L', score: '78-125' }
  ],
  18: [ // Western Bulldogs
    { opponent: 'ESS', result: 'W', score: '88-76' },
    { opponent: 'GCS', result: 'L', score: '88-102' },
    { opponent: 'SYD', result: 'L', score: '89-115' },
    { opponent: 'POR', result: 'W', score: '98-85' },
    { opponent: 'MEL', result: 'L', score: '89-112' }
  ]
}

// Common AFL venues
const AFL_VENUES = [
  'MCG', 'Marvel Stadium', 'SCG', 'Adelaide Oval', 'Optus Stadium',
  'Gabba', 'GMHBA Stadium', 'Metricon Stadium', 'York Park',
  'TIO Stadium', 'Manuka Oval', 'Mars Stadium'
]

// Generate a fixture for a round (9 games) with future dates
function generateRoundFixture(round: number, season: number = 2025): MockGame[] {
  const games: MockGame[] = []
  const teams = [...AFL_TEAMS]
  const shuffledTeams = teams.sort(() => Math.random() - 0.5)
  
  // Create 9 games (18 teams = 9 matches)
  for (let i = 0; i < 9; i++) {
    const homeTeam = shuffledTeams[i * 2]
    const awayTeam = shuffledTeams[i * 2 + 1]
    
    // Calculate game date - FUTURE dates for testing
    const now = new Date()
    const baseDate = new Date(now.getTime() + (round - 1) * 7 * 24 * 60 * 60 * 1000) // Each round is 1 week from now
    
    let gameDate: Date
    if (i === 0) {
      // Friday night game
      gameDate = new Date(baseDate.getTime() + 19.5 * 60 * 60 * 1000) // 7:30 PM Friday
    } else if (i < 5) {
      // Saturday games
      const hourOffset = i === 1 ? 13.5 : 19.5 // 1:30 PM or 7:30 PM
      gameDate = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000 + hourOffset * 60 * 60 * 1000)
    } else {
      // Sunday games
      const hourOffset = i === 5 ? 13.5 : 15.5 // 1:30 PM or 3:30 PM
      gameDate = new Date(baseDate.getTime() + 48 * 60 * 60 * 1000 + hourOffset * 60 * 60 * 1000)
    }
    
    const venue = AFL_VENUES[Math.floor(Math.random() * AFL_VENUES.length)]
    
    games.push({
      id: `mock-${season}-${round}-${i + 1}`,
      squiggleId: `${season}${round.toString().padStart(2, '0')}${(i + 1).toString().padStart(2, '0')}`,
      round,
      season,
      homeTeam: homeTeam.name,
      awayTeam: awayTeam.name,
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      venue,
      date: gameDate,
      homeScore: null,
      awayScore: null,
      winner: null,
      isComplete: false,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }
  
  return games
}

// Generate completed games with realistic scores
function generateCompletedGame(game: MockGame): MockGame {
  const homeScore = Math.floor(Math.random() * 60) + 60 // 60-120 points
  const awayScore = Math.floor(Math.random() * 60) + 60 // 60-120 points
  
  return {
    ...game,
    homeScore,
    awayScore,
    winner: homeScore > awayScore ? game.homeTeamId : game.awayTeamId,
    isComplete: true,
    updatedAt: new Date()
  }
}

// Mock game state management
class MockGameService {
  private static instance: MockGameService
  private mockData: Map<string, MockGame[]> = new Map()
  
  public static getInstance(): MockGameService {
    if (!MockGameService.instance) {
      MockGameService.instance = new MockGameService()
    }
    return MockGameService.instance
  }
  
  // Generate a full season fixture with FUTURE dates
  generateSeason(season: number = 2025, rounds: number = 23): MockGame[] {
    const allGames: MockGame[] = []
    
    for (let round = 1; round <= rounds; round++) {
      const roundGames = generateRoundFixture(round, season)
      allGames.push(...roundGames)
    }
    
    this.mockData.set(`season-${season}`, allGames)
    return allGames
  }
  
  // Get current round (first incomplete round)
  getCurrentRound(season: number = 2025): number {
    const games = this.getSeasonGames(season)
    
    for (let round = 1; round <= 23; round++) {
      const roundGames = games.filter(g => g.round === round)
      const incompleteGames = roundGames.filter(g => !g.isComplete)
      
      if (incompleteGames.length > 0) {
        return round
      }
    }
    
    return 1 // Default to round 1 if no incomplete games
  }
  
  // Get games for a specific round
  getRoundGames(season: number = 2025, round: number): MockGame[] {
    const games = this.getSeasonGames(season)
    return games.filter(g => g.round === round)
  }
  
  // Get all games for a season
  getSeasonGames(season: number = 2025): MockGame[] {
    if (!this.mockData.has(`season-${season}`)) {
      this.generateSeason(season)
    }
    return this.mockData.get(`season-${season}`) || []
  }
  
  // Complete some games (for testing scoring)
  completeGames(season: number, round: number, gameCount: number = 3): MockGame[] {
    const games = this.getSeasonGames(season)
    const roundGames = games.filter(g => g.round === round && !g.isComplete)
    
    for (let i = 0; i < Math.min(gameCount, roundGames.length); i++) {
      const gameIndex = games.findIndex(g => g.id === roundGames[i].id)
      if (gameIndex !== -1) {
        games[gameIndex] = generateCompletedGame(roundGames[i])
      }
    }
    
    return games.filter(g => g.round === round)
  }
  
  // Reset all games to incomplete (for testing)
  resetSeason(season: number = 2025): MockGame[] {
    const games = this.getSeasonGames(season)
    games.forEach(game => {
      game.homeScore = null
      game.awayScore = null
      game.winner = null
      game.isComplete = false
      game.updatedAt = new Date()
    })
    
    return games
  }
  
  // Simulate live scoring (gradually complete games)
  simulateLiveRound(season: number, round: number): MockGame[] {
    const roundGames = this.getRoundGames(season, round)
    const incompleteGames = roundGames.filter(g => !g.isComplete)
    
    if (incompleteGames.length > 0) {
      // Complete one random game
      const randomGame = incompleteGames[Math.floor(Math.random() * incompleteGames.length)]
      const games = this.getSeasonGames(season)
      const gameIndex = games.findIndex(g => g.id === randomGame.id)
      
      if (gameIndex !== -1) {
        games[gameIndex] = generateCompletedGame(randomGame)
      }
    }
    
    return this.getRoundGames(season, round)
  }
}

export const mockGameService = MockGameService.getInstance()

// Generate initial test data with FUTURE dates
export function initializeMockData() {
  console.log('🏈 Initializing mock AFL data for testing...')
  
  // Generate 2025 season with future dates
  const season2025 = mockGameService.generateSeason(2025, 23)
  
  // Complete first 2 rounds for testing (but keep Round 3+ for tipping)
  mockGameService.completeGames(2025, 1, 9) // Complete all Round 1 games
  mockGameService.completeGames(2025, 2, 6) // Complete 6 Round 2 games
  
  console.log(`✅ Generated ${season2025.length} games for 2025 season`)
  console.log(`🎯 Current round: ${mockGameService.getCurrentRound(2025)}`)
  
  return {
    totalGames: season2025.length,
    currentRound: mockGameService.getCurrentRound(2025),
    upcomingGames: mockGameService.getRoundGames(2025, mockGameService.getCurrentRound(2025))
  }
}

// Utility functions for components
export function getTeamById(id: number) {
  return AFL_TEAMS.find(team => team.id === id)
}

export function getTeamColors(teamName: string): { primary: string; secondary: string } {
  const team = AFL_TEAMS.find(t => t.name === teamName || t.nickname === teamName)
  return team ? { primary: team.primaryColor, secondary: team.secondaryColor } : { primary: '#000000', secondary: '#FFFFFF' }
}

export function getTeamLogo(teamName: string): string {
  const team = AFL_TEAMS.find(t => t.name === teamName || t.nickname === teamName)
  return team?.logo || ''
}

export function getTeamForm(teamId: number): Array<{opponent: string, result: 'W' | 'L', score: string}> {
  return TEAM_FORM[teamId] || []
}

export function getTeamFormRecord(teamId: number): { wins: number; losses: number } {
  const form = getTeamForm(teamId)
  return {
    wins: form.filter(game => game.result === 'W').length,
    losses: form.filter(game => game.result === 'L').length
  }
}