'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

// Define types
interface Job {
  id: string
  title: string
  description: string
  budget: number
  skills_required: string[]
  experience_level: string
  project_length: string
  created_at: string
  client: {
    name: string
    avatar_url: string | null
  }
}

interface Filters {
  budget_range?: string
  experience_level?: string
  project_length?: string
}

export default function JobsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<Job[]>([])
  const [filters, setFilters] = useState<Filters>({})
  const [searchTerm, setSearchTerm] = useState('')

  // Filter options
  const budgetRanges = [
    { label: '₹1,000 - ₹5,000', min: 1000, max: 5000 },
    { label: '₹5,000 - ₹10,000', min: 5000, max: 10000 },
    { label: '₹10,000+', min: 10000, max: null }
  ]

  const experienceLevels = ['Entry', 'Intermediate', 'Expert']
  const projectLengths = ['Less than 1 month', '1-3 months', '3-6 months', '6+ months']

  useEffect(() => {
    fetchJobs()
  }, [filters, searchTerm])

  async function fetchJobs() {
    try {
      setLoading(true)
      let query = supabase
        .from('jobs')
        .select(`
          *,
          client:profiles(name, avatar_url)
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.budget_range) {
        const [min, max] = filters.budget_range.split('-').map(Number)
        if (min) query = query.gte('budget', min)
        if (max) query = query.lte('budget', max)
      }

      if (filters.experience_level) {
        query = query.eq('experience_level', filters.experience_level)
      }

      if (filters.project_length) {
        query = query.eq('project_length', filters.project_length)
      }

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`)
      }

      const { data, error } = await query
      if (error) throw error
      setJobs(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  function applyFilter(type: keyof Filters, value: string) {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type] === value ? undefined : value
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2"
          />

          <div className="flex flex-wrap gap-4">
            {/* Budget Filter */}
            <div className="relative">
              <button
                onClick={() => document.getElementById('budget-dropdown')?.classList.toggle('hidden')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Budget <ChevronDown className="ml-2 h-4 w-4" />
              </button>
              <div id="budget-dropdown" className="hidden absolute z-10 mt-2 w-56 rounded-md bg-white shadow-lg">
                <div className="py-1">
                  {budgetRanges.map((range) => (
                    <button
                      key={range.label}
                      onClick={() => applyFilter('budget_range', `${range.min}-${range.max}`)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Experience Filter */}
            <div className="relative">
              <button
                onClick={() => document.getElementById('experience-dropdown')?.classList.toggle('hidden')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Experience <ChevronDown className="ml-2 h-4 w-4" />
              </button>
              <div id="experience-dropdown" className="hidden absolute z-10 mt-2 w-56 rounded-md bg-white shadow-lg">
                <div className="py-1">
                  {experienceLevels.map((level) => (
                    <button
                      key={level}
                      onClick={() => applyFilter('experience_level', level)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Project Length Filter */}
            <div className="relative">
              <button
                onClick={() => document.getElementById('length-dropdown')?.classList.toggle('hidden')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Project Length <ChevronDown className="ml-2 h-4 w-4" />
              </button>
              <div id="length-dropdown" className="hidden absolute z-10 mt-2 w-56 rounded-md bg-white shadow-lg">
                <div className="py-1">
                  {projectLengths.map((length) => (
                    <button
                      key={length}
                      onClick={() => applyFilter('project_length', length)}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {length}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="bg-white shadow rounded-md">
          <ul className="divide-y divide-gray-200">
            {loading ? (
              <li className="px-4 py-4">Loading...</li>
            ) : jobs.length > 0 ? (
              jobs.map((job) => (
                <li key={job.id}>
                  <Link href={`/jobs/${job.id}`} className="block hover:bg-gray-50">
                    <div className="px-4 py-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-blue-600">
                          {job.title}
                        </h3>
                        <p className="px-2 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                          ₹{job.budget}
                        </p>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        {job.description}
                      </p>
                      {job.skills_required && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {job.skills_required.map((skill) => (
                            <span
                              key={skill}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <span className="mr-4">{job.experience_level}</span>
                        <span>{job.project_length}</span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))
            ) : (
              <li className="px-4 py-4 text-center text-gray-500">
                No jobs found
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}