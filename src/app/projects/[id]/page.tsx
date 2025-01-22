'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Image from 'next/image'

interface Milestone {
  id: string
  title: string
  description: string
  amount: number
  due_date: string
  status: 'pending' | 'in_progress' | 'completed' | 'approved'
  created_at: string
}

interface Project {
  id: string
  status: 'in_progress' | 'completed'
  start_date: string
  earnings: number
  job: {
    id: string
    title: string
    description: string
    client: {
      id: string
      name: string
      avatar_url: string | null
    }
  }
  milestones_completed: number
  total_milestones: number
}

export default function ProjectDetails({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<Project | null>(null)
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [showMilestoneForm, setShowMilestoneForm] = useState(false)
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    amount: 0,
    due_date: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<'client' | 'freelancer' | null>(null)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }
    fetchProjectDetails(session.user.id)
  }

  async function fetchProjectDetails(userId: string) {
    try {
      setLoading(true)
      
      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          job:jobs(
            id,
            title,
            description,
            client:profiles(
              id,
              name,
              avatar_url
            )
          )
        `)
        .eq('id', params.id)
        .single()

      if (projectError) throw projectError
      setProject(projectData)

      // Determine user role
      if (projectData.job.client.id === userId) {
        setUserRole('client')
      } else if (projectData.freelancer_id === userId) {
        setUserRole('freelancer')
      }

      // Fetch milestones
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', params.id)
        .order('created_at', { ascending: true })

      if (milestonesError) throw milestonesError
      setMilestones(milestonesData)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function createMilestone(e: React.FormEvent) {
    e.preventDefault()
    try {
      const { data, error } = await supabase
        .from('project_milestones')
        .insert({
          project_id: params.id,
          title: newMilestone.title,
          description: newMilestone.description,
          amount: newMilestone.amount,
          due_date: newMilestone.due_date,
          status: 'pending'
        })
        .select()
        .single()

      if (error) throw error

      setMilestones([...milestones, data])
      setShowMilestoneForm(false)
      setNewMilestone({ title: '', description: '', amount: 0, due_date: '' })

    } catch (err: any) {
      setError(err.message)
    }
  }

  async function updateMilestoneStatus(milestoneId: string, newStatus: Milestone['status']) {
    try {
      const { error } = await supabase
        .from('project_milestones')
        .update({ status: newStatus })
        .eq('id', milestoneId)

      if (error) throw error

      setMilestones(milestones.map(m => 
        m.id === milestoneId ? { ...m, status: newStatus } : m
      ))

      // Update project progress if milestone is completed
      if (newStatus === 'approved') {
        const { error: projectError } = await supabase
          .from('projects')
          .update({
            milestones_completed: project!.milestones_completed + 1,
            earnings: project!.earnings + milestones.find(m => m.id === milestoneId)!.amount
          })
          .eq('id', params.id)

        if (projectError) throw projectError

        setProject(project => project ? {
          ...project,
          milestones_completed: project.milestones_completed + 1,
          earnings: project.earnings + milestones.find(m => m.id === milestoneId)!.amount
        } : null)
      }

    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Project not found</h2>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Project Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{project.job.title}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Started on {new Date(project.start_date).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center">
                <div className="mr-4 text-right">
                  <p className="text-sm text-gray-500">Client</p>
                  <p className="text-sm font-medium text-gray-900">{project.job.client.name}</p>
                </div>
                <Image
                  src={project.job.client.avatar_url || '/default-avatar.png'}
                  alt=""
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              </div>
            </div>
            <div className="mt-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Progress</p>
                    <p className="text-lg font-medium text-gray-900">
                      {project.milestones_completed} of {project.total_milestones} milestones
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Earnings</p>
                    <p className="text-lg font-medium text-gray-900">
                      ₹{project.earnings.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full
                      ${project.status === 'in_progress' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {project.status.replace('_', ' ').charAt(0).toUpperCase() + 
                       project.status.slice(1).replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Milestones</h3>
              {userRole === 'client' && !showMilestoneForm && (
                <button
                  onClick={() => setShowMilestoneForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Add Milestone
                </button>
              )}
            </div>

            {showMilestoneForm && (
              <form onSubmit={createMilestone} className="mb-6 bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Title
                    </label>
                    <input
                      type="text"
                      value={newMilestone.title}
                      onChange={e => setNewMilestone({ ...newMilestone, title: e.target.value })}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={newMilestone.amount}
                      onChange={e => setNewMilestone({ ...newMilestone, amount: parseInt(e.target.value) })}
                      required
                      min="0"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={newMilestone.description}
                    onChange={e => setNewMilestone({ ...newMilestone, description: e.target.value })}
                    required
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newMilestone.due_date}
                    onChange={e => setNewMilestone({ ...newMilestone, due_date: e.target.value })}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowMilestoneForm(false)}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Create Milestone
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {milestones.map(milestone => (
                <div
                  key={milestone.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{milestone.title}</h4>
                      <p className="mt-1 text-sm text-gray-500">{milestone.description}</p>
                      <div className="mt-2 flex items-center space-x-4">
                        <p className="text-sm font-medium text-gray-900">
                          ₹{milestone.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          Due: {new Date(milestone.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full
                        ${milestone.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : milestone.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : milestone.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                      </span>
                      
                      {userRole === 'freelancer' && milestone.status === 'in_progress' && (
                        <button
                          onClick={() => updateMilestoneStatus(milestone.id, 'completed')}
                          className="bg-green-600 text-white px-3 py-1 rounded-md text-sm hover:bg-green-700"
                        >
                          Mark Complete
                        </button>
                      )}
                      
                      {userRole === 'client' && milestone.status === 'completed' && (
                        <button
                          onClick={() => updateMilestoneStatus(milestone.id, 'approved')}
                          className="bg-purple-600 text-white px-3 py-1 rounded-md text-sm hover:bg-purple-700"
                        >
                          Approve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {milestones.length === 0 && (
                <div className="text-center py-6 text-gray-500">
                  No milestones created yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}