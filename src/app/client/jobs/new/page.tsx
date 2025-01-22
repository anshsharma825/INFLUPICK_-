'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function PostJob() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newSkill, setNewSkill] = useState('')
  const [jobData, setJobData] = useState({
    title: '',
    description: '',
    budget_min: '',
    budget_max: '',
    required_skills: [] as string[],
    type: 'fixed',
    experience_level: '',
    duration: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('jobs')
        .insert({
          client_id: session.user.id,
          title: jobData.title,
          description: jobData.description,
          budget_min: parseInt(jobData.budget_min),
          budget_max: parseInt(jobData.budget_max),
          required_skills: jobData.required_skills,
          type: jobData.type,
          experience_level: jobData.experience_level,
          duration: jobData.duration,
          status: 'open'
        })
        .select()
        .single()

      if (error) throw error

      router.push('/client/jobs')

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function addSkill() {
    if (newSkill.trim() && !jobData.required_skills.includes(newSkill.trim())) {
      setJobData({
        ...jobData,
        required_skills: [...jobData.required_skills, newSkill.trim()]
      })
      setNewSkill('')
    }
  }

  function removeSkill(skillToRemove: string) {
    setJobData({
      ...jobData,
      required_skills: jobData.required_skills.filter(skill => skill !== skillToRemove)
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Post a New Job</h1>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Job Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Job Title
                </label>
                <input
                  type="text"
                  value={jobData.title}
                  onChange={(e) => setJobData({ ...jobData, title: e.target.value })}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="e.g., Full Stack Developer Needed for E-commerce Project"
                />
              </div>

              {/* Job Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Job Description
                </label>
                <textarea
                  value={jobData.description}
                  onChange={(e) => setJobData({ ...jobData, description: e.target.value })}
                  required
                  rows={6}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="Describe the project, requirements, and expectations..."
                />
              </div>

              {/* Budget Range */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Minimum Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={jobData.budget_min}
                    onChange={(e) => setJobData({ ...jobData, budget_min: e.target.value })}
                    required
                    min="0"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Maximum Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={jobData.budget_max}
                    onChange={(e) => setJobData({ ...jobData, budget_max: e.target.value })}
                    required
                    min="0"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
              </div>

              {/* Required Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Required Skills
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {jobData.required_skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-2 text-blue-600 hover:text-blue-500"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a required skill..."
                    className="flex-1 border border-gray-300 rounded-md shadow-sm p-2"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Job Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Job Type
                </label>
                <select
                  value={jobData.type}
                  onChange={(e) => setJobData({ ...jobData, type: e.target.value })}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="fixed">Fixed Price</option>
                  <option value="hourly">Hourly Rate</option>
                </select>
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Required Experience Level
                </label>
                <select
                  value={jobData.experience_level}
                  onChange={(e) => setJobData({ ...jobData, experience_level: e.target.value })}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="">Select Level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="expert">Expert</option>
                </select>
              </div>

              {/* Project Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Expected Duration
                </label>
                <select
                  value={jobData.duration}
                  onChange={(e) => setJobData({ ...jobData, duration: e.target.value })}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="">Select Duration</option>
                  <option value="less_than_1_month">Less than 1 month</option>
                  <option value="1_to_3_months">1 to 3 months</option>
                  <option value="3_to_6_months">3 to 6 months</option>
                  <option value="more_than_6_months">More than 6 months</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {loading ? 'Posting...' : 'Post Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}