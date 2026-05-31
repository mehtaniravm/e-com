import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function Layout() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">⚡ E-Commerce</div>

        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            🏠 Dashboard
          </NavLink>
          <NavLink to="/orders" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            📦 Orders
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin/users" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              👥 User Management
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <strong>{user?.email}</strong>
            {user?.role}
          </div>
          <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
