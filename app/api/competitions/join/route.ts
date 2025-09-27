import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { code, competitionId } = body

    // Get user
    let user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let competition

    // Find competition by code or ID
    if (code) {
      competition = await prisma.competition.findUnique({
        where: { code: code.toUpperCase() },
        include: {
          users: true
        }
      })
      
      if (!competition) {
        return NextResponse.json({ error: 'Competition not found. Please check the code and try again.' }, { status: 404 })
      }
    } else if (competitionId) {
      competition = await prisma.competition.findUnique({
        where: { id: competitionId },
        include: {
          users: true
        }
      })
      
      if (!competition) {
        return NextResponse.json({ error: 'Competition not found' }, { status: 404 })
      }

      // Check if competition is public
      const settings = competition.settings as any
      if (settings?.isPrivate === true) {
        return NextResponse.json({ error: 'This is a private competition. You need a code to join.' }, { status: 403 })
      }
    } else {
      return NextResponse.json({ error: 'Either code or competitionId is required' }, { status: 400 })
    }

    // Check if competition is active
    if (!competition.isActive) {
      return NextResponse.json({ error: 'This competition is not currently active' }, { status: 403 })
    }

    // Check if user is already a member
    const existingMember = competition.users.find(u => u.userId === user.id)
    if (existingMember) {
      return NextResponse.json({ error: 'You are already a member of this competition' }, { status: 409 })
    }

    // Add user to competition
    await prisma.competitionUser.create({
      data: {
        userId: user.id,
        competitionId: competition.id,
        role: 'member',
      }
    })

    // Return competition details
    const updatedCompetition = await prisma.competition.findUnique({
      where: { id: competition.id },
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
    })

    return NextResponse.json(updatedCompetition)
  } catch (error) {
    console.error('Error joining competition:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
