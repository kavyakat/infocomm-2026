import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function OrganizerRoute({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!profile) return <Navigate to="/organizer/login" replace />
  if (profile.role !== 'organizer') return <Navigate to="/" replace />
  return <>{children}</>
}
