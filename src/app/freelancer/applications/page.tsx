'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

interface Application {
  id: string
  created_at: string
  proposal: string
  bid_amount: number
  status: 'pending' | 'accepted' | 'rejected'
  job: {
    id: string
    title: string
    client: {
      id: string
      name: string
      avatar_url: string | null
    }
  }
  messages_count: number
  last_message_at: string | null
}

interface Filters {
  status: 'all' | 'pending' | 'accepted' | 'rejected'
  sortBy: 'newest' | 'oldest' | 'bid_high' | 'bid_low'
}

export default function ApplicationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<Application[]>([])
  const [filters, setFilters] = useState<Filters>({
    status: 'all',
    sortBy: 'newest'
  })
  const [error, setError] = useState<string | null>(null)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [message, setMessage] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  useEffect(() => {
    fetchApplications()
  }, [filters])

  async function fetchApplications() {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      let query = supabase
        .from('job_applications')
        .select(`
          *,
          job:jobs(
            id,
            title,
            client_id
          )
        `)
        .eq('freelancer_id', session.user.id)

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      switch (filters.sortBy) {
        case 'oldest':
          query = query.order('created_at', { ascending: true })
          break
        case 'bid_high':
          query = query.order('bid_amount', { ascending: false })
          break
        case 'bid_low':
          query = query.order('bid_amount', { ascending: true })
          break
        default:
          query = query.order('created_at', { ascending: false })
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      const formattedData = data?.map((app: any) => ({
        ...app,
        messages_count: app.messages?.[0]?.count || 0,
        last_message_at: app.last_message?.[0]?.created_at || null
      })) || []

      setApplications(formattedData)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedApp || !message.trim()) return

    try {
      setSendingMessage(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      const { error: messageError } = await supabase
        .from('application_messages')
        .insert({
          application_id: selectedApp.id,
          sender_id: session.user.id,
          receiver_id: selectedApp.job.client.id,
          message: message.trim()
        })

      if (messageError) throw messageError

      setMessage('')
      setShowMessageModal(false)
      fetchApplications()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSendingMessage(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
          
          <div className="flex gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as Filters['status'] })}
              className="border border-gray-300 rounded-md shadow-sm p-2"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value as Filters['sortBy'] })}
              className="border border-gray-300 rounded-md shadow-sm p-2"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="bid_high">Highest Bid</option>
              <option value="bid_low">Lowest Bid</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {applications.map((application) => (
              <li key={application.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {application.job.title}
                      </h3>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        Applied on {new Date(application.created_at).toLocaleDateString()}
                        <span className="mx-2">•</span>
                        Bid: ₹{application.bid_amount.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full
                        ${application.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : application.status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </span>
                      
                      <button
                        onClick={() => {
                          setSelectedApp(application)
                          setShowMessageModal(true)
                        }}
                        className="text-gray-400 hover:text-gray-500"
                        title="Messages"
                      >
                        Messages
                        {application.messages_count > 0 && (
                          <span className="ml-1 text-xs">{application.messages_count}</span>
                        )}
                      </button>

                      <button
                        onClick={() => router.push(`/jobs/${application.job.id}`)}
                        className="text-gray-400 hover:text-gray-500"
                        title="View Job"
                      >
                        View Job
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}

            {applications.length === 0 && (
              <li className="px-4 py-8">
                <div className="text-center text-gray-500">
                  No applications found
                </div>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Message Modal */}
      {showMessageModal && selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Messages - {selectedApp.job.title}
            </h3>
            
            <form onSubmit={sendMessage} className="space-y-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="Type your message..."
              />
              
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowMessageModal(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingMessage || !message.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {sendingMessage ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}