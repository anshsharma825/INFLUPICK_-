import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'INFLUPICK - Amplify Your Creative Journey',
  description: 'Connect with top brands and create impactful content that resonates with your audience.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-black">
        {/* Fixed Navigation */}
        <div className="fixed top-0 left-0 right-0 z-50">
          <Navigation />
        </div>
        
        {/* Main Content with top padding for navigation */}
        <div className="pt-16">
          {children}
        </div>
      </body>
    </html>
  )
}