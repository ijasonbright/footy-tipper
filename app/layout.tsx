import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { 
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton
} from '@clerk/nextjs'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AFL Tipper Pro',
  description: 'The ultimate AFL tipping competition app',
  manifest: '/manifest.json',
  themeColor: '#0066CC',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  icons: {
    apple: '/icon-192x192.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="manifest" href="/manifest.json" />
          <link rel="apple-touch-icon" href="/icon-192x192.png" />
          <meta name="theme-color" content="#0066CC" />
        </head>
        <body className={inter.className}>
          <header className="bg-white shadow-sm border-b">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
              <div className="text-xl font-bold text-blue-600">
                AFL Tipper Pro
              </div>
              <div className="flex items-center gap-4">
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">
                      Sign Up
                    </button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </div>
            </div>
          </header>
          <Providers>
            {children}
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}