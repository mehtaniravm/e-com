import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

interface Props {
  requiredRole?: string
}

export default function PrivateRoute({ requiredRole }: Props) {
  const { isAuthenticated, user } = useAuth()

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (requiredRole && user?.role !== requiredRole) return <Navigate to="/dashboard" replace />

  return <Outlet />
}
