'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Image from 'next/image'

interface Job {
  id: string
  title: string
  description: string
  budget_min: number
  budget_max: number
  required_skills: string[]
  type: 'fixed' | 'hourly'
  experience_level: string
  created_at: string
  client: {
    name: string
    avatar_url: string | null
  }
  applications_count: number
}

export default function JobSearch() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<Job[]>([])
  const [filters, setFilters] = useState({
    type: '',
    experience_level: '',
    min_budget: '',
    skills: [] as string[]
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [newSkill, setNewSkill] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchJobs()
  }, [filters])

  async function fetchJobs() {
    try {
      setLoading(true)
      let query = supabase
        .from('jobs')
        .select(`
          *,
          client:profiles(name, avatar_url),
          applications_count:job_applications(count)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.type) {
        query = query.eq('type', filters.type)
      }
      if (filters.experience_level) {
        query = query.eq('experience_level', filters.experience_level)
      }
      if (filters.min_budget) {
        query = query.gte('budget_min', parseInt(filters.min_budget))
      }
      if (filters.skills.length > 0) {
        query = query.contains('required_skills', filters.skills)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError
      setJobs(data || [])

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function addSkill() {
    if (newSkill.trim() && !filters.skills.includes(newSkill.trim())) {
      setFilters({
        ...filters,
        skills: [...filters.skills, newSkill.trim()]
      })
      setNewSkill('')
    }
  }

  function removeSkill(skillToRemove: string) {
    setFilters({
      ...filters,
      skills: filters.skills.filter(skill => skill !== skillToRemove)
    })
  }

  const filteredJobs = jobs.filter(job =>
    searchTerm
      ? job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              <div className="col-span-full">
                <label className="block text-sm font-medium text-gray-700">
                  Search Jobs
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title or description..."
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Job Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="">All Types</option>
                  <option value="fixed">Fixed Price</option>
                  <option value="hourly">Hourly Rate</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Experience Level
                </label>
                <select
                  value={filters.experience_level}
                  onChange={(e) => setFilters({ ...filters, experience_level: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="expert">Expert</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Minimum Budget
                </label>
                <input
                  type="number"
                  value={filters.min_budget}
                  onChange={(e) => setFilters({ ...filters, min_budget: e.target.value })}
                  placeholder="Enter amount"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>

              <div className="col-span-full">
                <label className="block text-sm font-medium text-gray-700">
                  Skills
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {filters.skills.map(skill => (
                    <span
                      key={skill}
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
                    placeholder="Add a skill..."
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
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="space-y-3 mt-4">
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredJobs.map(job => (
                  <div
                    key={job.id}
                    className="border border-gray-200 rounded-lg p-6 hover:border-gray-300"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          <button
                            onClick={() => router.push(`/jobs/${job.id}`)}
                            className="hover:text-blue-600"
                          >
                            {job.title}
                          </button>
                        </h3>
                        <div className="mt-1 flex items-center space-x-2">
                          <div className="flex items-center">
                            <Image
                              src={job.client.avatar_url || '/default-avatar.png'}
                              alt=""
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                            <span className="ml-2 text-sm text-gray-500">
                              {job.client.name}
                            </span>
                          </div>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-gray-500">
                            Posted {new Date(job.created_at).toLocaleDateString()}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-gray-500">
                            {job.applications_count} applications
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-medium text-gray-900">
                          ₹{job.budget_min.toLocaleString()} - ₹{job.budget_max.toLocaleString()}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          {job.type === 'fixed' ? 'Fixed Price' : 'Hourly Rate'}
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-gray-600">
                      {job.description.length > 200
                        ? `${job.description.substring(0, 200)}...`
                        : job.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {job.required_skills.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

                {filteredJobs.length === 0 && (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-gray-900">No jobs found</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      Try adjusting your search filters
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}