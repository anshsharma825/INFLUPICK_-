'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

// Types
interface Portfolio {
  title: string
  description: string
  link: string
}

interface Skills {
  category: string
  skills: string[]
}

interface FormErrors {
  email?: string
  password?: string
  name?: string
  phone?: string
  experience?: string
  rate?: string
  portfolio?: string
  aadhaar?: string
}

export default function FreelancerSignUp() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  // Basic Info - Step 1
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  // Professional Info - Step 2
  const [skills, setSkills] = useState<Skills[]>([
    {
      category: 'Video Editing',
      skills: ['Adobe Premiere Pro', 'Final Cut Pro', 'DaVinci Resolve']
    },
    {
      category: 'Thumbnail Design',
      skills: ['Photoshop', 'Canva', 'Illustrator']
    }
  ])
  const [portfolio, setPortfolio] = useState<Portfolio[]>([])
  const [experience, setExperience] = useState('')
  const [rate, setRate] = useState({ min: '', max: '' })

  // Verification - Step 3
  const [aadhaarNumber, setAadhaarNumber] = useState('')
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null)

  // Validate current step
  const validateStep = (currentStep: number): boolean => {
    const errors: FormErrors = {}

    if (currentStep === 1) {
      if (!email) errors.email = 'Email is required'
      else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Invalid email format'
      
      if (!password) errors.password = 'Password is required'
      else if (password.length < 6) errors.password = 'Password must be at least 6 characters'
      
      if (!name) errors.name = 'Name is required'
      if (!phone) errors.phone = 'Phone is required'
      else if (!/^\+?[\d\s-]{10,}$/.test(phone)) errors.phone = 'Invalid phone format'
    }

    if (currentStep === 2) {
      if (!experience) errors.experience = 'Experience level is required'
      if (!rate.min || !rate.max) errors.rate = 'Rate range is required'
      if (portfolio.length === 0) errors.portfolio = 'Add at least one portfolio item'
    }

    if (currentStep === 3) {
      if (!aadhaarNumber) errors.aadhaar = 'Aadhaar number is required'
      else if (!/^\d{12}$/.test(aadhaarNumber.replace(/\D/g, ''))) 
        errors.aadhaar = 'Invalid Aadhaar number'
      if (!aadhaarFile) errors.aadhaar = 'Aadhaar card upload is required'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle step navigation
  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  // Add portfolio item
  const addPortfolioItem = () => {
    setPortfolio([...portfolio, { title: '', description: '', link: '' }])
  }

  // Update portfolio item
  const updatePortfolioItem = (index: number, field: keyof Portfolio, value: string) => {
    const newPortfolio = [...portfolio]
    newPortfolio[index][field] = value
    setPortfolio(newPortfolio)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep(3)) return

    setLoading(true)
    setError(null)

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError

      // 2. Upload Aadhaar file
      let aadhaarUrl = ''
      if (aadhaarFile) {
        const { data: fileData, error: fileError } = await supabase.storage
          .from('verifications')
          .upload(`aadhaar/${authData.user?.id}`, aadhaarFile)

        if (fileError) throw fileError
        aadhaarUrl = fileData.path
      }

      // 3. Create freelancer profile
      const { error: profileError } = await supabase
        .from('freelancers')
        .insert({
          user_id: authData.user?.id,
          name,
          phone,
          experience,
          rate_min: rate.min,
          rate_max: rate.max,
          skills,
          portfolio,
          aadhaar_number: aadhaarNumber,
          aadhaar_file: aadhaarUrl,
          status: 'pending'
        })

      if (profileError) throw profileError

      // Success! Redirect to dashboard
      router.push('/dashboard')

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Create Freelancer Account</h1>

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
        <form onSubmit={handleSubmit} className="space-y-4">
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
                  className={`mt-1 block w-full border rounded-md shadow-sm p-2 
                    ${formErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="your@email.com"
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                )}
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
                  className={`mt-1 block w-full border rounded-md shadow-sm p-2
                    ${formErrors.password ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="••••••••"
                />
                {formErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                )}
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
                  className={`mt-1 block w-full border rounded-md shadow-sm p-2
                    ${formErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Your full name"
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                )}
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
                  className={`mt-1 block w-full border rounded-md shadow-sm p-2
                    ${formErrors.phone ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="+91 1234567890"
                />
                {formErrors.phone && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Next Step
                </button>
              </div>
            </>
          )}

          {/* Step 2: Professional Information */}
          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Experience Level
                </label>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className={`mt-1 block w-full border rounded-md shadow-sm p-2
                    ${formErrors.experience ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select experience</option>
                  <option value="beginner">Beginner (0-2 years)</option>
                  <option value="intermediate">Intermediate (2-5 years)</option>
                  <option value="expert">Expert (5+ years)</option>
                </select>
                {formErrors.experience && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.experience}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Hourly Rate (₹)
                </label>
                <div className="flex gap-4">
                  <input
                    type="number"
                    value={rate.min}
                    onChange={(e) => setRate({ ...rate, min: e.target.value })}
                    placeholder="Min"
                    className={`mt-1 block w-full border rounded-md shadow-sm p-2
                      ${formErrors.rate ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  <input
                    type="number"
                    value={rate.max}
                    onChange={(e) => setRate({ ...rate, max: e.target.value })}
                    placeholder="Max"
                    className={`mt-1 block w-full border rounded-md shadow-sm p-2
                      ${formErrors.rate ? 'border-red-500' : 'border-gray-300'}`}
                  />
                </div>
                {formErrors.rate && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.rate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Portfolio
                </label>
                {portfolio.map((item, index) => (
                  <div key={index} className="mb-4 p-4 border border-gray-200 rounded">
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updatePortfolioItem(index, 'title', e.target.value)}
                      placeholder="Project Title"
                      className="mb-2 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updatePortfolioItem(index, 'description', e.target.value)}
                      placeholder="Description"
                      className="mb-2 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                    <input
                      type="url"
                      value={item.link}
                      onChange={(e) => updatePortfolioItem(index, 'link', e.target.value)}
                      placeholder="Project URL"
                      className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addPortfolioItem}
                  className="text-blue-600 hover:text-blue-700"
                >
                  + Add Portfolio Item
                </button>
                {formErrors.portfolio && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.portfolio}</p>
                )}
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
                  onClick={handleNextStep}
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
                  className={`mt-1 block w-full border rounded-md shadow-sm p-2
                    ${formErrors.aadhaar ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="XXXX-XXXX-XXXX"
                />
                {formErrors.aadhaar && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.aadhaar}</p>
                )}
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
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {loading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}