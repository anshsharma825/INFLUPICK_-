'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SignUpPage() {
  const [userType, setUserType] = useState<'influencer' | 'freelancer' | null>(null)
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Join TalentBridge</h1>

        <div className="space-y-4">
          {/* User Type Selection */}
          <div className="flex gap-4">
            <button
              onClick={() => setUserType('influencer')}
              className={`flex-1 p-4 border rounded-lg ${
                userType === 'influencer' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <h3 className="font-medium">Influencer</h3>
              <p className="text-sm text-gray-500">I want to hire talent</p>
            </button>

            <button
              onClick={() => setUserType('freelancer')}
              className={`flex-1 p-4 border rounded-lg ${
                userType === 'freelancer' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <h3 className="font-medium">Freelancer</h3>
              <p className="text-sm text-gray-500">I want to find work</p>
            </button>
          </div>

          {/* Continue Button */}
          <button
            onClick={() => userType && router.push(`/signup/${userType}`)}
            disabled={!userType}
            className="w-full bg-blue-600 text-white p-3 rounded-lg disabled:bg-gray-300"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}