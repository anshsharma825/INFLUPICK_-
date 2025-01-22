'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Types
interface SocialLinks {
  instagram: string
  youtube: string
  tiktok: string
  twitter: string
}

interface ProfileData {
  bio: string
  category: string
  followers: string
  engagement: string
  recentPosts: string[]
}

export default function InfluencerSignUp() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Basic Info - Step 1
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  // Social Links - Step 2
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    instagram: '',
    youtube: '',
    tiktok: '',
    twitter: ''
  })

  // Auto-filled data from AI scan
  const [profileData, setProfileData] = useState<ProfileData>({
    bio: '',
    category: '',
    followers: '',
    engagement: '',
    recentPosts: []
  })

  // Verification - Step 3
  const [aadhaarNumber, setAadhaarNumber] = useState('')
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null)

  // Function to scan social profiles
  async function scanSocialProfile(platform: string, url: string) {
    if (!url) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Simulated API call (we'll add real AI integration later)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setProfileData({
        bio: "Content Creator | Digital Influencer",
        category: "Lifestyle & Fashion",
        followers: "10K+",
        engagement: "High",
        recentPosts: ["Fashion", "Lifestyle", "Travel"]
      })
      
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Create Influencer Account</h1>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {[1, 2, 3].map((stepNumber) => (
              <div
                key={stepNumber}
                className={`w-1/3 h-2 rounded ${
                  step >= stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-sm text-gray-500">Step {step} of 3</p>
        </div>

        {/* Multi-step Form */}
        <form className="space-y-4">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="+91 1234567890"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Next Step
                </button>
              </div>
            </>
          )}

          {/* Step 2: Social Media Links */}
          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Instagram Profile URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={socialLinks.instagram}
                    onChange={(e) => setSocialLinks({
                      ...socialLinks,
                      instagram: e.target.value
                    })}
                    className="mt-1 flex-1 border border-gray-300 rounded-md shadow-sm p-2"
                    placeholder="https://instagram.com/yourusername"
                  />
                  <button
                    type="button"
                    onClick={() => scanSocialProfile('instagram', socialLinks.instagram)}
                    className="mt-1 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
                    disabled={loading || !socialLinks.instagram}
                  >
                    {loading ? 'Scanning...' : 'Scan'}
                  </button>
                </div>
              </div>

              {/* Show scanned data if available */}
              {profileData.bio && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900">Profile Information</h3>
                  <dl className="mt-2 space-y-2">
                    <div>
                      <dt className="text-sm text-gray-500">Bio</dt>
                      <dd className="text-sm text-gray-900">{profileData.bio}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Category</dt>
                      <dd className="text-sm text-gray-900">{profileData.category}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Followers</dt>
                      <dd className="text-sm text-gray-900">{profileData.followers}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Engagement</dt>
                      <dd className="text-sm text-gray-900">{profileData.engagement}</dd>
                    </div>
                  </dl>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  YouTube Channel URL
                </label>
                <input
                  type="url"
                  value={socialLinks.youtube}
                  onChange={(e) => setSocialLinks({
                    ...socialLinks,
                    youtube: e.target.value
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="https://youtube.com/@yourchannel"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  TikTok Profile URL
                </label>
                <input
                  type="url"
                  value={socialLinks.tiktok}
                  onChange={(e) => setSocialLinks({
                    ...socialLinks,
                    tiktok: e.target.value
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="https://tiktok.com/@yourusername"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Twitter Profile URL
                </label>
                <input
                  type="url"
                  value={socialLinks.twitter}
                  onChange={(e) => setSocialLinks({
                    ...socialLinks,
                    twitter: e.target.value
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="https://twitter.com/yourusername"
                />
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Next Step
                </button>
              </div>
            </>
          )}

          {/* Step 3: Verification */}
          {step === 3 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Aadhaar Number
                </label>
                <input
                  type="text"
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value)}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="XXXX-XXXX-XXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Upload Aadhaar Card (Front & Back)
                </label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setAadhaarFile(e.target.files?.[0] || null)}
                  required
                  className="mt-1 block w-full"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Upload clear images of both sides of your Aadhaar card
                </p>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Create Account
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}