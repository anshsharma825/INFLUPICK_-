'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

interface Project {
  id: string
  title: string
  description: string
  budget: number
  status: string
  created_at: string
}

interface Application {
  id: string
  job_id: string
  status: string
  created_at: string
  job: {
    title: string
  }
}

interface Stats {
  total_earnings: number
  completed_projects: number
  active_projects: number
  success_rate: number
}

interface JobApplicationResponse {
  id: string
  job_id: string
  status: string
  created_at: string
  job: {
    title: string
  }
}

export default function FreelancerDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [stats, setStats] = useState<Stats>({
    total_earnings: 0,
    completed_projects: 0,
    active_projects: 0,
    success_rate: 0
  })

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      await Promise.all([
        fetchProjects(session.user.id),
        fetchApplications(session.user.id),
        fetchStats(session.user.id)
      ])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchProjects(userId: string) {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('freelancer_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  async function fetchApplications(userId: string) {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          id,
          job_id,
          status,
          created_at,
          job:jobs!inner (
            title
          )
        `)
        .eq('freelancer_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)
        .returns<JobApplicationResponse[]>()

      if (error) throw error
      
      const formattedApplications: Application[] = (data || []).map(app => ({
        id: app.id,
        job_id: app.job_id,
        status: app.status,
        created_at: app.created_at,
        job: {
          title: app.job.title
        }
      }))

      setApplications(formattedApplications)
    } catch (error) {
      console.error('Error fetching applications:', error)
      setApplications([])
    }
  }

  async function fetchStats(userId: string) {
    try {
      const { data, error } = await supabase
        .rpc('get_freelancer_stats', {
          user_id: userId
        })

      if (error) throw error
      setStats(data || {
        total_earnings: 0,
        completed_projects: 0,
        active_projects: 0,
        success_rate: 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 py-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Earnings
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ₹{stats.total_earnings}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Completed Projects
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.completed_projects}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Projects
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.active_projects}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Success Rate
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.success_rate}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Projects List */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg leading-6 font-medium text-gray-900">
              Active Projects
            </h2>
            <Link href="/freelancer/projects" className="text-sm text-blue-600 hover:text-blue-500">
              View all
            </Link>
          </div>
          <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
            <ul role="list" className="divide-y divide-gray-200">
              {projects.length > 0 ? (
                projects.map((project) => (
                  <li key={project.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {project.title}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {project.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
                  No active projects
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Applications List */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg leading-6 font-medium text-gray-900">
              Recent Applications
            </h2>
            <Link href="/freelancer/applications" className="text-sm text-blue-600 hover:text-blue-500">
              View all
            </Link>
          </div>
          <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
            <ul role="list" className="divide-y divide-gray-200">
              {applications.length > 0 ? (
                applications.map((app) => (
                  <li key={app.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {app.job.title}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            {app.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
                  No applications yet
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}