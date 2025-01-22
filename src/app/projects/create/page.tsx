'use client'
import { useRouter } from 'next/navigation'
import CreateProjectForm from '@/components/projects/CreateProjectForm'

export default function CreateProjectPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Create New Project</h1>
          <button
            onClick={() => router.push('/projects')}
            className="text-gray-600 hover:text-gray-900"
          >
            Back to Projects
          </button>
        </div>

        {/* Form */}
        <CreateProjectForm />
      </div>
    </div>
  )
}