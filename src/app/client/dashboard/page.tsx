'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Image from 'next/image'
import { MessageSquare, Edit, Copy, Star, BarChart2, X } from 'lucide-react'

interface JobStats {
  total_applications: number
  acceptance_rate: number
  average_bid: number
  active_projects: number
}

interface Message {
  id: string
  created_at: string
  message: string
  sender_id: string
  sender: {
    name: string
    avatar_url: string | null
  }
  attachments?: { name: string; url: string }[]
}

interface Job {
  id: string
  title: string
  description: string
  budget_min: number
  budget_max: number
  type: 'fixed' | 'hourly'
  experience_level: string
  status: 'open' | 'in_progress' | 'completed'
  created_at: string
  applications_count: number
  hired_freelancer?: {
    id: string
    name: string
    avatar_url: string | null
    rating?: number
  }
  category: string
  required_skills: string[]
}

interface JobApplication {
  id: string
  created_at: string
  status: 'pending' | 'accepted' | 'rejected'
  proposal: string
  bid_amount: number
  freelancer: {
    id: string
    name: string
    avatar_url: string | null
    experience: string
    skills: string[]
  }
}

export default function ClientDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<string | null>(null)
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [error, setError] = useState<string | null>(null)
  const [session, setSession] = useState<any>(null)
  
  // Stats and modals
  const [jobStats, setJobStats] = useState<JobStats | null>(null)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [selectedApplicant, setSelectedApplicant] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [rating, setRating] = useState(0)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (selectedJob) {
      fetchApplications(selectedJob)
    }
  }, [selectedJob])

  async function checkUser() {
    const { data: { session: userSession } } = await supabase.auth.getSession()
    if (!userSession) {
      router.push('/login')
      return
    }
    setSession(userSession)
    await fetchJobs(userSession.user.id)
    await fetchJobStats(userSession.user.id)
  }
  async function fetchJobs(userId: string) {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          applications_count:job_applications(count),
          hired_freelancer:profiles(id, name, avatar_url)
        `)
        .eq('client_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setJobs(data)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchJobStats(userId: string) {
    try {
      const { data, error } = await supabase.rpc('get_client_job_stats', {
        client_id: userId
      })

      if (error) throw error
      setJobStats(data)
    } catch (err) {
      console.error('Error fetching job stats:', err)
    }
  }

  async function fetchApplications(jobId: string) {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          freelancer:profiles(
            id,
            name,
            avatar_url,
            experience,
            skills
          )
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setApplications(data)

    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleApplicationStatus(applicationId: string, status: 'accepted' | 'rejected') {
    try {
      const { error } = await supabase
        .from('job_applications')
        .update({ status })
        .eq('id', applicationId)

      if (error) throw error

      setApplications(prev =>
        prev.map(app =>
          app.id === applicationId
            ? { ...app, status }
            : app
        )
      )

      if (status === 'accepted' && selectedJob) {
        const application = applications.find(app => app.id === applicationId)
        if (application) {
          await createConversation(application.freelancer.id, selectedJob)
        }
      }

    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleEditJob(e: React.FormEvent) {
    e.preventDefault()
    if (!editingJob) return

    try {
      const { error } = await supabase
        .from('jobs')
        .update({
          title: editingJob.title,
          description: editingJob.description,
          budget_min: editingJob.budget_min,
          budget_max: editingJob.budget_max,
          required_skills: editingJob.required_skills,
          status: editingJob.status
        })
        .eq('id', editingJob.id)

      if (error) throw error

      setJobs(prev => 
        prev.map(job => 
          job.id === editingJob.id ? editingJob : job
        )
      )
      setShowEditModal(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function duplicateJob(jobId: string) {
    const jobToDuplicate = jobs.find(job => job.id === jobId)
    if (!jobToDuplicate || !session) return

    try {
      const { error } = await supabase
        .from('jobs')
        .insert({
          ...jobToDuplicate,
          id: undefined,
          created_at: new Date().toISOString(),
          status: 'open',
          client_id: session.user.id
        })

      if (error) throw error
      fetchJobs(session.user.id)
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function createConversation(freelancerId: string, jobId: string) {
    if (!session) return

    try {
      const { error } = await supabase
        .from('conversations')
        .insert({
          job_id: jobId,
          client_id: session.user.id,
          freelancer_id: freelancerId
        })

      if (error) throw error
    } catch (err) {
      console.error('Error creating conversation:', err)
    }
  }

  async function submitRating(jobId: string, freelancerId: string) {
    try {
      const { error } = await supabase
        .from('freelancer_ratings')
        .insert({
          job_id: jobId,
          freelancer_id: freelancerId,
          rating,
          feedback
        })

      if (error) throw error

      setShowRatingModal(false)
      setRating(0)
      setFeedback('')
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function fetchMessages(applicationId: string) {
    try {
      const { data, error } = await supabase
        .from('application_messages')
        .select(`
          *,
          sender:profiles(name, avatar_url)
        `)
        .eq('application_id', applicationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data)
    } catch (err) {
      console.error('Error fetching messages:', err)
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedApplicant || !newMessage.trim() || !session) return

    try {
      const { error } = await supabase
        .from('application_messages')
        .insert({
          application_id: selectedApplicant,
          sender_id: session.user.id,
          message: newMessage.trim()
        })

      if (error) throw error

      setNewMessage('')
      fetchMessages(selectedApplicant)
    } catch (err) {
      console.error('Error sending message:', err)
    }
  }

  // Your existing render code remains the same
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ... your existing JSX ... */}
    </div>
  )
}