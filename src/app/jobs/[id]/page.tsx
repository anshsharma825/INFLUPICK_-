'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Image from 'next/image'
import { Share2, Bookmark, Flag } from 'lucide-react'

interface Job {
  id: string
  title: string
  description: string
  budget_min: number
  budget_max: number
  required_skills: string[]
  type: 'fixed' | 'hourly'
  experience_level: string
  duration: string
  created_at: string
  client: {
    id: string
    name: string
    avatar_url: string | null
    jobs_posted: number
    total_hires: number
    rating: number
    reviews: number
  }
  applications_count: number
  category: string
}

interface Application {
  id: string
  proposal: string
  bid_amount: number
  created_at: string
  status: 'pending' | 'accepted' | 'rejected'
  milestones?: {
    description: string
    amount: number
    duration: number
  }[]
  attachments?: string[]
}

interface SimilarJob {
  id: string
  title: string
  budget_min: number
  budget_max: number
  client: {
    name: string
    company: string
  }
}

export default function JobDetails({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [job, setJob] = useState<Job | null>(null)
  const [similarJobs, setSimilarJobs] = useState<SimilarJob[]>([])
  const [existingApplication, setExistingApplication] = useState<Application | null>(null)
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [newApplication, setNewApplication] = useState({
    proposal: '',
    bid_amount: 0,
    milestones: [{ description: '', amount: 0, duration: 0 }],
    attachments: [] as string[]
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<'client' | 'freelancer' | null>(null)
  const [isSaved, setIsSaved] = useState(false)  
  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }
    fetchJobDetails(session.user.id)
    checkIfJobSaved(session.user.id)
  }

  async function checkIfJobSaved(userId: string) {
    const { data } = await supabase
      .from('saved_jobs')
      .select()
      .eq('job_id', params.id)
      .eq('freelancer_id', userId)
      .single()
    
    setIsSaved(!!data)
  }

  async function toggleSaveJob() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    try {
      if (isSaved) {
        await supabase
          .from('saved_jobs')
          .delete()
          .eq('job_id', params.id)
          .eq('freelancer_id', session.user.id)
      } else {
        await supabase
          .from('saved_jobs')
          .insert({
            job_id: params.id,
            freelancer_id: session.user.id
          })
      }
      setIsSaved(!isSaved)
    } catch (err) {
      console.error('Error toggling job save:', err)
    }
  }

  async function fetchJobDetails(userId: string) {
    try {
      setLoading(true)
      
      // Fetch job details with client info
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select(`
          *,
          client:profiles(
            id,
            name,
            avatar_url,
            jobs_posted:jobs(count),
            total_hires:projects(count),
            rating,
            reviews:client_reviews(count)
          ),
          applications_count:job_applications(count)
        `)
        .eq('id', params.id)
        .single()

      if (jobError) throw jobError
      setJob(jobData)

      // Fetch similar jobs
      const { data: similarData } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          budget_min,
          budget_max,
          client:profiles!inner(name, company)
        `)
        .neq('id', params.id)
        .eq('status', 'open')
        .limit(3)

      setSimilarJobs(similarData?.map(job => ({
        id: job.id,
        title: job.title,
        budget_min: job.budget_min,
        budget_max: job.budget_max,
        client: {
          name: job.client[0].name,
          company: job.client[0].company
        }
      })) || [])

      // Set user role
      if (jobData.client.id === userId) {
        setUserRole('client')
      } else {
        setUserRole('freelancer')
      }

      // Check for existing application
      const { data: applicationData, error: applicationError } = await supabase
        .from('job_applications')
        .select('*')
        .eq('job_id', params.id)
        .eq('freelancer_id', userId)
        .single()

      if (!applicationError) {
        setExistingApplication(applicationData)
      }

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function shareJob() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: job?.title,
          text: `Check out this job: ${job?.title}`,
          url: window.location.href
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  async function submitApplication(e: React.FormEvent) {
    e.preventDefault()
    try {
      setSubmitting(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('job_applications')
        .insert({
          job_id: params.id,
          freelancer_id: session.user.id,
          proposal: newApplication.proposal,
          bid_amount: newApplication.bid_amount,
          milestones: newApplication.milestones,
          status: 'pending'
        })
        .select()
        .single()

      if (error) throw error

      setExistingApplication(data)
      setShowApplicationForm(false)
      setNewApplication({ 
        proposal: '', 
        bid_amount: 0, 
        milestones: [{ description: '', amount: 0, duration: 0 }],
        attachments: []
      })

    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
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

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Job not found</h2>
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        Posted {new Date(job.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="text-sm text-gray-500">
                        {job.applications_count} applications
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={shareJob}
                      className="p-2 text-gray-400 hover:text-gray-500"
                      title="Share Job"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                    {userRole === 'freelancer' && (
                      <button
                        onClick={toggleSaveJob}
                        className={`p-2 ${isSaved ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-500'}`}
                        title={isSaved ? 'Saved' : 'Save Job'}
                      >
                        <Bookmark className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Rest of your existing JSX remains the same */}
            {/* ... */}

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Info */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900">About the Client</h2>
                <div className="mt-4">
                  <div className="flex items-center">
                    <Image
                      src={job.client.avatar_url || '/default-avatar.png'}
                      alt=""
                      width={48}
                      height={48}
                      className="rounded-full"
                    />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">
                        {job.client.name}
                      </h3>
                      <div className="mt-1 text-sm text-gray-500">
                        <p>{job.client.jobs_posted} jobs posted</p>
                        <p>{job.client.total_hires} total hires</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < Math.round(job.client.rating) ? 'fill-current' : 'fill-gray-300'}`}
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">
                        ({job.client.reviews} reviews)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Similar Jobs */}
            {similarJobs.length > 0 && (
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900">Similar Jobs</h2>
                  <div className="mt-4 space-y-4">
                    {similarJobs.map((similarJob) => (
                      <div key={similarJob.id} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                        <h3 className="text-sm font-medium text-gray-900">
                          <button 
                            onClick={() => router.push(`/jobs/${similarJob.id}`)}
                            className="hover:text-blue-600"
                          >
                            {similarJob.title}
                          </button>
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {similarJob.client.company}
                        </p>
                        <p className="mt-1 text-sm text-gray-900">
                          ₹{similarJob.budget_min.toLocaleString()} - ₹{similarJob.budget_max.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}