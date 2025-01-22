'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Image from 'next/image'

interface FileAttachment {
  id: string
  url: string
  filename: string
  content_type: string
  size: number
  created_at: string
}

interface Message {
  id: string
  content: string
  created_at: string
  sender_id: string
  conversation_id: string
  sender: {
    name: string
    avatar_url: string
  }
  attachments?: FileAttachment[]
}

interface Conversation {
  id: string
  job: {
    id: string
    title: string
  }
  other_user: {
    id: string
    name: string
    avatar_url: string | null
  }
  last_message: {
    content: string
    created_at: string
  } | null
  unread_count: number
}

interface ConversationResponse {
  id: string
  job: [{
    id: string
    title: string
  }]
  other_user: [{
    id: string
    name: string
    avatar_url: string | null
  }]
  last_message: [{
    content: string
    created_at: string
  }] | null
  unread_count: number
}

export default function MessagesPage() {
  const router = useRouter()
  const endOfMessagesRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    checkUser()
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, handleNewMessage)
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (currentConversation) {
      fetchMessages(currentConversation)
      markConversationAsRead(currentConversation)
    }
  }, [currentConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }
    setUserId(session.user.id)
    fetchConversations()
  }

  const handleNewMessage = (payload: any) => {
    const newMessage = payload.new as Message
    if (newMessage.conversation_id === currentConversation) {
      setMessages(prev => [...prev, newMessage])
      markConversationAsRead(currentConversation)
    } else {
      fetchConversations() // Update unread counts
    }
  }

  async function fetchConversations() {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      const { data, error: fetchError } = await supabase
        .from('conversations')
        .select(`
          id,
          job:jobs(id, title),
          other_user:profiles!other_user_id(id, name, avatar_url),
          last_message:messages(content, created_at),
          unread_count
        `)
        .eq('user_id', session.user.id)
        .order('updated_at', { ascending: false })

      if (fetchError) throw fetchError

      const transformedData: Conversation[] = (data as ConversationResponse[]).map(conv => ({
        id: conv.id,
        job: conv.job[0],
        other_user: conv.other_user[0],
        last_message: conv.last_message ? conv.last_message[0] : null,
        unread_count: conv.unread_count
      }))

      setConversations(transformedData)

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchMessages(conversationId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(name, avatar_url)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data as Message[])

    } catch (err: any) {
      setError(err.message)
    }
  }

  async function markConversationAsRead(conversationId: string) {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ unread_count: 0 })
        .eq('id', conversationId)

      if (error) throw error
      
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unread_count: 0 }
            : conv
        )
      )

    } catch (err: any) {
      console.error('Error marking conversation as read:', err)
    }
  }

  async function handleFileUpload(files: FileList) {
    try {
      setUploading(true)
      
      for (const file of files) {
        // Upload file to Supabase Storage
        const { data: fileData, error: uploadError } = await supabase
          .storage
          .from('message-attachments')
          .upload(`${currentConversation}/${Date.now()}-${file.name}`, file)

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase
          .storage
          .from('message-attachments')
          .getPublicUrl(fileData.path)

        // Create message with attachment
        const { error: messageError } = await supabase
          .from('messages')
          .insert({
            conversation_id: currentConversation,
            sender_id: userId,
            content: `Sent file: ${file.name}`,
            attachments: [{
              url: publicUrl,
              filename: file.name,
              content_type: file.type,
              size: file.size
            }]
          })

        if (messageError) throw messageError
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!newMessage.trim() || !currentConversation) return

    try {
      setSending(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        router.push('/login')
        return
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: currentConversation,
          sender_id: session.user.id,
          content: newMessage.trim()
        })

      if (error) throw error
      setNewMessage('')

    } catch (err: any) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  function scrollToBottom() {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse flex space-x-4">
            <div className="w-1/3">
              <div className="h-12 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
            <div className="flex-1 space-y-4 py-1">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="flex h-[calc(100vh-6rem)]">
            {/* Conversations List */}
            <div className="w-1/3 border-r border-gray-200 bg-gray-50">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
              </div>
              <div className="overflow-y-auto h-[calc(100%-4rem)]">
                {conversations.map(conversation => (
                  <button
                    key={conversation.id}
                    onClick={() => setCurrentConversation(conversation.id)}
                    className={`w-full p-4 text-left hover:bg-gray-100 flex items-start space-x-3
                      ${currentConversation === conversation.id ? 'bg-gray-100' : ''}`}
                  >
                    <div className="relative w-10 h-10">
                      <Image
                        src={conversation.other_user.avatar_url || '/default-avatar.png'}
                        alt=""
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {conversation.other_user.name}
                        </p>
                        {conversation.last_message && (
                          <p className="text-xs text-gray-500">
                            {formatDate(conversation.last_message.created_at)}
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {conversation.job.title}
                      </p>
                      {conversation.last_message && (
                        <p className="text-sm text-gray-500 truncate">
                          {conversation.last_message.content}
                        </p>
                      )}
                      {conversation.unread_count > 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                  </button>
                ))}

                {conversations.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    No conversations yet
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 flex flex-col">
              {currentConversation ? (
                <>
                  {/* Message Header */}
                  <div className="p-4 border-b border-gray-200">
                    {conversations.find(c => c.id === currentConversation)?.other_user.name}
                  </div>

                  {/* Message List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map(message => (
                      <div
                        key={message.id}
                        className={`flex items-start space-x-2 ${
                          message.sender_id === userId ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.sender_id !== userId && (
                          <div className="relative w-8 h-8">
                            <Image
                              src={message.sender.avatar_url || '/default-avatar.png'}
                              alt=""
                              fill
                              className="rounded-full object-cover"
                            />
                          </div>
                        )}
                        <div
                          className={`rounded-lg px-4 py-2 max-w-sm ${
                            message.sender_id === userId
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          {message.attachments?.map((attachment, index) => (
                            <div key={index} className="mt-2">
                              <a
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`text-sm flex items-center space-x-2 ${
                                  message.sender_id === userId
                                    ? 'text-blue-100 hover:text-white'
                                    : 'text-blue-600 hover:text-blue-700'
                                }`}
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                  />
                                </svg>
                                <span>{attachment.filename}</span>
                              </a>
                            </div>
                          ))}
                          <p className="text-xs mt-1 opacity-75">
                            {formatDate(message.created_at)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={endOfMessagesRef} />
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200">
                    <form onSubmit={sendMessage} className="space-y-2">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1 border border-gray-300 rounded-md shadow-sm px-4 py-2"
                        />
                        <button
                          type="submit"
                          disabled={sending || !newMessage.trim()}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                        >
                          Send
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          multiple
                          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                          className="hidden"
                          id="file-upload"
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                        />
                        <label
                          htmlFor="file-upload"
                          className="cursor-pointer text-sm text-blue-600 hover:text-blue-500"
                        >
                          Attach files
                        </label>
                        {uploading && <span className="text-sm text-gray-500">Uploading...</span>}
                      </div>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-gray-500">
                    Select a conversation to start messaging
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}