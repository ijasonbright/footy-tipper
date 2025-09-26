import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Trophy, Users, Target, TrendingUp } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="afl-gradient text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              AFL Tipper Pro
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              The ultimate AFL tipping competition platform. Compete with friends, 
              track your performance, and prove you're the footy expert.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-up">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-4 text-lg">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 font-semibold px-8 py-4 text-lg">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for AFL Tipping
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built by footy fans, for footy fans. Get all the tools you need to run 
              successful tipping competitions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 afl-card">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Competitions</h3>
              <p className="text-gray-600">
                Create private competitions with friends or join public leagues
              </p>
            </div>

            <div className="text-center p-6 afl-card">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart Tipping</h3>
              <p className="text-gray-600">
                Confidence points, margin betting, and multiple scoring systems
              </p>
            </div>

            <div className="text-center p-6 afl-card">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Live Tracking</h3>
              <p className="text-gray-600">
                Real-time score updates and live leaderboards during games
              </p>
            </div>

            <div className="text-center p-6 afl-card">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Social Features</h3>
              <p className="text-gray-600">
                Chat, achievements, and expert predictions to enhance the experience
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Start Tipping?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of AFL fans already using AFL Tipper Pro for their 
            tipping competitions. It's free to get started!
          </p>
          <Link href="/sign-up">
            <Button size="lg" className="afl-button-primary px-8 py-4 text-lg">
              Create Account Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-300 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold text-white">AFL Tipper Pro</h3>
              <p className="text-sm">The ultimate AFL tipping experience</p>
            </div>
            <div className="text-sm">
              © 2024 AFL Tipper Pro. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
