import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
// Try default import first
import CompetitionContent from './competition-content'
// Alternative: import { CompetitionContent } from './competition-content'

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

  // Get user
  const user = await prisma.user.findUnique({
    where: { clerkId: userId }
  })

  if (!user) {
    redirect('/sign-in')
  }

  // Get competition with detailed information
  const competition = await prisma.competition.findUnique({
    where: { id: params.id },
    include: {
      users: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              imageUrl: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: [
          { totalPoints: 'desc' },
          { joinedAt: 'asc' }
        ]
      }
    }
  })

  if (!competition) {
    notFound()
  }

  // Check if user is a member of this competition
  const userMembership = competition.users.find(cu => cu.userId === user.id)
  
  if (!userMembership) {
    redirect('/dashboard')
  }

  // Get current round games (you'll need to implement this based on your game fetching logic)
  // For now, we'll pass an empty array
  const currentRoundGames: any[] = []

  // Get user's tips for current round
  const userTips = await prisma.tip.findMany({
    where: {
      userId: user.id,
      competitionId: competition.id,
      // Add game filter for current round when you implement games
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <CompetitionContent
          competition={competition}
          user={user}
          userMembership={userMembership}
          currentRoundGames={currentRoundGames}
          userTips={userTips}
        />
      </div>
    </div>
  )
}