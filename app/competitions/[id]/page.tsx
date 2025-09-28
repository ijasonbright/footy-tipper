import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { CompetitionContent } from './competition-content'

interface CompetitionPageProps {
  params: {
    id: string
  }
}

export default async function CompetitionPage({ params }: CompetitionPageProps) {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Get user from database
  const user = await prisma.user.findUnique({
    where: { clerkId: userId }
  })

  if (!user) {
    redirect('/sign-in')
  }

  // Get competition with user relationship
  const competition = await prisma.competition.findUnique({
    where: { id: params.id },
    include: {
      users: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              imageUrl: true
            }
          }
        }
      }
    }
  })

  if (!competition) {
    redirect('/dashboard')
  }

  // Check if user is member of this competition
  const userMembership = competition.users.find(u => u.userId === user.id)
  
  if (!userMembership) {
    redirect('/dashboard')
  }

  // Get user role and competition settings
  const userRole = userMembership.role as 'admin' | 'member'
  const competitionSettings = competition.settings as any

  return (
    <CompetitionContent
      competitionId={competition.id}
      userId={user.id}
      userRole={userRole}
      competitionSettings={{
        allowConfidence: competitionSettings?.allowConfidence || false,
        allowMargin: competitionSettings?.allowMargin || false,
        scoringSystem: competitionSettings?.scoringSystem || 'standard'
      }}
      competition={{
        name: competition.name,
        code: competition.code,
        season: competition.season,
        memberCount: competition.users.length
      }}
    />
  )
}