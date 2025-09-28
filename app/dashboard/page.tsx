import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { DashboardContent } from './dashboard-content'
import { prisma } from '@/lib/db'

export default async function DashboardPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  const clerkUser = await currentUser()

  // Get or create user in database
  let user = await prisma.user.findUnique({
    where: { clerkId: userId }
  })

  if (!user) {
    // Create user if doesn't exist
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

  // Get user's competitions
  const userCompetitions = await prisma.competitionUser.findMany({
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <DashboardContent 
          user={user} 
          competitions={userCompetitions} 
        />
      </div>
    </div>
  )
}