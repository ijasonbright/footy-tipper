import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    message: 'AFL Tipper API',
    version: '1.0.0',
    endpoints: {
      competitions: '/api/competitions',
      games: '/api/games',
      tips: '/api/tips',
      auth: '/api/auth'
    }
  })
}