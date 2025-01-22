'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import ProfileForm from '@/components/profile/ProfileForm'

export default function ProfilePage() {
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
      }
    }

    checkUser()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <nav className="bg-white shadow-lg mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-800">TalentBridge</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/dashboard" className="px-4 py-2 text-gray-600 hover:text-gray-900">
                Dashboard
              </a>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProfileForm />
      </div>
    </div>
  )
}