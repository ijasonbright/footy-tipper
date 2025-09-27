import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user to exclude competitions they're already in
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        competitions: {
          select: {
            competitionId: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userCompetitionIds = user.competitions.map(c => c.competitionId)

    // Find public competitions that the user hasn't joined
    const publicCompetitions = await prisma.competition.findMany({
      where: {
        isActive: true,
        settings: {
          path: ['isPrivate'],
          equals: false
        },
        id: {
          notIn: userCompetitionIds
        }
      },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
      take: 20 // Limit to 20 most recent
    })

    return NextResponse.json(publicCompetitions)
  } catch (error) {
    console.error('Error fetching public competitions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
