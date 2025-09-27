import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Dashboard
        </h1>
        <p className="text-gray-600 mb-8">
          Competition features are being built. Coming soon!
        </p>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">0</p>
              <p className="text-sm text-gray-600">Competitions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">0</p>
              <p className="text-sm text-gray-600">Tips Made</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">0</p>
              <p className="text-sm text-gray-600">Points</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}