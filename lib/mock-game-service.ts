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

// AFL Teams with correct IDs matching Squiggle API
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

// Common AFL venues
const AFL_VENUES = [
  'MCG', 'Marvel Stadium', 'SCG', 'Adelaide Oval', 'Optus Stadium',
  'Gabba', 'GMHBA Stadium', 'Metricon Stadium', 'York Park',
  'TIO Stadium', 'Manuka Oval', 'Mars Stadium'
]

// Generate a fixture for a round (9 games)
function generateRoundFixture(round: number, season: number = 2025): MockGame[] {
  const games: MockGame[] = []
  const teams = [...AFL_TEAMS]
  const shuffledTeams = teams.sort(() => Math.random() - 0.5)
  
  // Create 9 games (18 teams = 9 matches)
  for (let i = 0; i < 9; i++) {
    const homeTeam = shuffledTeams[i * 2]
    const awayTeam = shuffledTeams[i * 2 + 1]
    
    // Calculate game date (Friday night, Saturday afternoon/night, Sunday)
    const baseDate = new Date(2025, 2, 15) // March 15, 2025 (example season start)
    const roundStartDate = new Date(baseDate.getTime() + (round - 1) * 7 * 24 * 60 * 60 * 1000)
    
    let gameDate: Date
    if (i === 0) {
      // Friday night game
      gameDate = new Date(roundStartDate.getTime() + 19.5 * 60 * 60 * 1000) // 7:30 PM Friday
    } else if (i < 5) {
      // Saturday games
      const hourOffset = i === 1 ? 13.5 : 19.5 // 1:30 PM or 7:30 PM
      gameDate = new Date(roundStartDate.getTime() + 24 * 60 * 60 * 1000 + hourOffset * 60 * 60 * 1000)
    } else {
      // Sunday games
      const hourOffset = i === 5 ? 13.5 : 15.5 // 1:30 PM or 3:30 PM
      gameDate = new Date(roundStartDate.getTime() + 48 * 60 * 60 * 1000 + hourOffset * 60 * 60 * 1000)
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
  
  // Generate a full season fixture
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

// Generate initial test data
export function initializeMockData() {
  console.log('🏈 Initializing mock AFL data for testing...')
  
  // Generate 2025 season
  const season2025 = mockGameService.generateSeason(2025, 23)
  
  // Complete first 3 rounds for testing
  mockGameService.completeGames(2025, 1, 9) // Complete all Round 1 games
  mockGameService.completeGames(2025, 2, 6) // Complete 6 Round 2 games
  mockGameService.completeGames(2025, 3, 3) // Complete 3 Round 3 games
  
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
  const colorMap: Record<string, { primary: string; secondary: string }> = {
    'Adelaide': { primary: '#003366', secondary: '#FFCC00' },
    'Brisbane Lions': { primary: '#722F37', secondary: '#FFC72C' },
    'Carlton': { primary: '#001F3E', secondary: '#FFFFFF' },
    'Collingwood': { primary: '#000000', secondary: '#FFFFFF' },
    'Essendon': { primary: '#C41E3A', secondary: '#000000' },
    'Fremantle': { primary: '#2E1A47', secondary: '#00D4AA' },
    'Geelong': { primary: '#1E3A8A', secondary: '#FFFFFF' },
    'Gold Coast': { primary: '#B41E3A', secondary: '#FFD100' },
    'GWS': { primary: '#FF6600', secondary: '#333333' },
    'Hawthorn': { primary: '#4D2004', secondary: '#FFD100' },
    'Melbourne': { primary: '#0F1419', secondary: '#FF0000' },
    'North Melbourne': { primary: '#003F7F', secondary: '#FFFFFF' },
    'Port Adelaide': { primary: '#00B2A9', secondary: '#000000' },
    'Richmond': { primary: '#FFFF00', secondary: '#000000' },
    'St Kilda': { primary: '#A41E22', secondary: '#000000' },
    'Sydney': { primary: '#ED1C24', secondary: '#FFFFFF' },
    'West Coast': { primary: '#003F7F', secondary: '#FFD100' },
    'Western Bulldogs': { primary: '#E31837', secondary: '#003F7F' },
  }

  return colorMap[teamName] || { primary: '#000000', secondary: '#FFFFFF' }
}
