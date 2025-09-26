const SQUIGGLE_BASE_URL = 'https://api.squiggle.com.au'

export interface SquiggleGame {
  id: number
  round: number
  hteam: string
  ateam: string
  hteamid: number
  ateamid: number
  venue: string
  date: string
  hscore?: number
  ascore?: number
  winner?: number
  complete: number
  year: number
}

export interface SquiggleTeam {
  id: number
  name: string
  nickname: string
  abbrev: string
  primarycolour?: string
  secondarycolour?: string
  logo?: string
}

export interface SquiggleTip {
  gameid: number
  source: string
  updated: string
  hconfidence: number
  aconfidence: number
  hmargin: number
  amargin: number
  tip: number
}

class SquiggleAPI {
  private async fetchFromSquiggle<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    const searchParams = new URLSearchParams()
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString())
      }
    })

    const url = `${SQUIGGLE_BASE_URL}/${endpoint}?${searchParams.toString()}`
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'AFL-Tipper-Pro/1.0',
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      })

      if (!response.ok) {
        throw new Error(`Squiggle API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching from Squiggle API:', error)
      throw error
    }
  }

  // Get games for a specific round and year
  async getGames(year: number = 2024, round?: number): Promise<SquiggleGame[]> {
    const params: any = { q: 'games', year }
    if (round) params.round = round

    const response = await this.fetchFromSquiggle<{ games: SquiggleGame[] }>('', params)
    return response.games || []
  }

  // Get current round
  async getCurrentRound(year: number = 2024): Promise<number> {
    const games = await this.getGames(year)
    
    // Find the first incomplete round
    const rounds = games.reduce((acc, game) => {
      if (!acc[game.round]) acc[game.round] = { total: 0, complete: 0 }
      acc[game.round].total++
      if (game.complete === 1) acc[game.round].complete++
      return acc
    }, {} as Record<number, { total: number; complete: number }>)

    for (const [round, stats] of Object.entries(rounds)) {
      if (stats.complete < stats.total) {
        return parseInt(round)
      }
    }

    // If all rounds are complete, return the next round
    const maxRound = Math.max(...Object.keys(rounds).map(Number))
    return maxRound + 1
  }

  // Get all teams
  async getTeams(): Promise<SquiggleTeam[]> {
    const response = await this.fetchFromSquiggle<{ teams: SquiggleTeam[] }>('', { q: 'teams' })
    return response.teams || []
  }

  // Get tips from experts/models
  async getTips(year: number = 2024, round?: number, source?: string): Promise<SquiggleTip[]> {
    const params: any = { q: 'tips', year }
    if (round) params.round = round
    if (source) params.source = source

    const response = await this.fetchFromSquiggle<{ tips: SquiggleTip[] }>('', params)
    return response.tips || []
  }

  // Get standings
  async getStandings(year: number = 2024): Promise<any[]> {
    const response = await this.fetchFromSquiggle<{ standings: any[] }>('', { 
      q: 'standings', 
      year 
    })
    return response.standings || []
  }

  // Get ladder
  async getLadder(year: number = 2024, round?: number): Promise<any[]> {
    const params: any = { q: 'ladder', year }
    if (round) params.round = round

    const response = await this.fetchFromSquiggle<{ ladder: any[] }>('', params)
    return response.ladder || []
  }
}

export const squiggleAPI = new SquiggleAPI()

// Helper function to format team names
export function formatTeamName(team: string): string {
  const teamMap: Record<string, string> = {
    'Adelaide': 'Adelaide Crows',
    'Brisbane Lions': 'Brisbane',
    'Carlton': 'Carlton Blues',
    'Collingwood': 'Collingwood Magpies',
    'Essendon': 'Essendon Bombers',
    'Fremantle': 'Fremantle Dockers',
    'Geelong': 'Geelong Cats',
    'Gold Coast': 'Gold Coast Suns',
    'GWS': 'GWS Giants',
    'Hawthorn': 'Hawthorn Hawks',
    'Melbourne': 'Melbourne Demons',
    'North Melbourne': 'North Melbourne Kangaroos',
    'Port Adelaide': 'Port Adelaide Power',
    'Richmond': 'Richmond Tigers',
    'St Kilda': 'St Kilda Saints',
    'Sydney': 'Sydney Swans',
    'West Coast': 'West Coast Eagles',
    'Western Bulldogs': 'Western Bulldogs',
  }

  return teamMap[team] || team
}

// Helper function to get team colors
export function getTeamColors(teamName: string): { primary: string; secondary: string } {
  const colorMap: Record<string, { primary: string; secondary: string }> = {
    'Adelaide': { primary: '#003366', secondary: '#FFCC00' },
    'Brisbane': { primary: '#722F37', secondary: '#FFC72C' },
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
