'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function ProfileForm() {
  const [loading, setLoading] = useState(true)
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [website, setWebsite] = useState('')
  const [skills, setSkills] = useState('')
  const [userType, setUserType] = useState('')
  const [message, setMessage] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    getProfile()
  }, [])

  async function getProfile() {
    try {
      setError(null)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('No user found. Please log in.')
        return
      }

      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        setError('Error loading profile: ' + error.message)
        return
      }
      
      if (data) {
        setFullName(data.full_name || '')
        setBio(data.bio || '')
        setWebsite(data.website || '')
        setSkills(data.skills || '')
        setUserType(data.user_type || '')
        setAvatar(data.avatar_url || null)
      }
    } catch (error: any) {
      setError('Error loading profile: ' + error.message)
    } finally {
      setLoading(false)
    }
  }
  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setError(null)
      setSuccess(null)
      setUploading(true)

      if (!event.target.files || event.target.files.length === 0) {
        setError('Please select an image to upload.')
        return
      }

      const file = event.target.files[0]
      
      // Check file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size must be less than 2MB')
        return
      }

      // Check file type
      if (!file.type.match(/image\/(jpeg|jpg|png)/)) {
        setError('Only JPEG, JPG, and PNG files are allowed')
        return
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase()
      if (!fileExt || !['jpg', 'jpeg', 'png'].includes(fileExt)) {
        setError('Invalid file type. Please use JPEG, JPG, or PNG')
        return
      }

      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError, data } = await supabase.storage
        .from('freelancer influencer')
        .upload(filePath, file)

      if (uploadError) {
        if (uploadError.message.includes('storage quota')) {
          setError('Storage quota exceeded. Please contact support.')
        } else if (uploadError.message.includes('permission')) {
          setError('Permission denied. Please log in again.')
        } else {
          setError('Error uploading image. Please try again.')
        }
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('freelancer influencer')
        .getPublicUrl(filePath)

      setAvatar(publicUrl)
      setSuccess('Image uploaded successfully!')

    } catch (error: any) {
      console.error('Error details:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  async function updateProfile() {
    try {
      setError(null)
      setSuccess(null)
      setLoading(true)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('No user found. Please log in again.')
        return
      }

      // Validate required fields
      if (!fullName.trim()) {
        setError('Full name is required')
        return
      }

      const updates = {
        id: user.id,
        full_name: fullName.trim(),
        bio: bio.trim(),
        website: website.trim(),
        skills: skills.trim(),
        user_type: userType,
        avatar_url: avatar,
        updated_at: new Date().toISOString(),
      }

      let { error: updateError } = await supabase
        .from('profiles')
        .upsert(updates)

      if (updateError) {
        setError('Error updating profile: ' + updateError.message)
        return
      }

      setSuccess('Profile updated successfully!')
    } catch (error: any) {
      setError('Error updating profile: ' + error.message)
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
          <span 
            className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer"
            onClick={() => setError(null)}
          >
            <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <title>Close</title>
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
            </svg>
          </span>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded relative">
          <span className="block sm:inline">{success}</span>
          <span 
            className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer"
            onClick={() => setSuccess(null)}
          >
            <svg className="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <title>Close</title>
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
            </svg>
          </span>
        </div>
      )}

      <div className="space-y-4">
        <div className="mb-6">
          {avatar ? (
            <div className="relative w-24 h-24 mx-auto mb-4">
              <img
                src={avatar}
                alt="Avatar"
                className="rounded-full object-cover w-full h-full"
              />
            </div>
          ) : (
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-500">No image</span>
            </div>
          )}
          <div className="flex justify-center">
            <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-200">
              {uploading ? 'Uploading...' : 'Upload Avatar'}
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={uploadAvatar}
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your full name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Tell us about yourself"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Website</label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://your-website.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Skills (comma separated)</label>
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Video Editing, Social Media, Content Creation"
          />
        </div>

        <button
          onClick={() => updateProfile()}
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-blue-300 transition duration-200"
        >
          {loading ? 'Saving...' : 'Update Profile'}
        </button>
      </div>
    </div>
  )
}