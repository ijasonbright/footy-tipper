import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { generateCompetitionCode } from '@/lib/utils'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, isPrivate, scoringSystem, allowConfidence, allowMargin } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Competition name is required' }, { status: 400 })
    }

    // Get or create user
    const clerkUser = await currentUser()
    let user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          clerkId: userId,
          email: clerkUser?.primaryEmailAddress?.emailAddress || '',
          username: clerkUser?.username || clerkUser?.firstName || 'User',
          firstName: clerkUser?.firstName,
          lastName: clerkUser?.lastName,
          imageUrl: clerkUser?.imageUrl,
        }
      })
    }

    // Generate unique competition code
    let competitionCode: string
    let isUnique = false
    let attempts = 0
    
    do {
      competitionCode = generateCompetitionCode()
      const existing = await prisma.competition.findUnique({
        where: { code: competitionCode }
      })
      isUnique = !existing
      attempts++
    } while (!isUnique && attempts < 10)

    if (!isUnique) {
      return NextResponse.json({ error: 'Failed to generate unique code' }, { status: 500 })
    }

    // Create competition
    const competition = await prisma.competition.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        code: competitionCode,
        createdBy: user.id,
        season: new Date().getFullYear(),
        settings: {
          isPrivate: isPrivate === true,
          scoringSystem: scoringSystem || 'standard',
          allowConfidence: allowConfidence === true,
          allowMargin: allowMargin === true,
        },
      }
    })

    // Add creator as admin
    await prisma.competitionUser.create({
      data: {
        userId: user.id,
        competitionId: competition.id,
        role: 'admin',
      }
    })

    return NextResponse.json(competition)
  } catch (error) {
    console.error('Error creating competition:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's competitions
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const competitions = await prisma.competitionUser.findMany({
      where: { userId: user.id },
      include: {
        competition: {
          include: {
            users: {
              include: {
                user: {
                  select: {
                    username: true,
                    imageUrl: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { joinedAt: 'desc' }
    })

    return NextResponse.json(competitions)
  } catch (error) {
    console.error('Error fetching competitions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}