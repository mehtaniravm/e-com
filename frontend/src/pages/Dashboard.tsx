import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function Dashboard() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()

  const firstName = user?.email.split('@')[0] ?? 'there'

  const navCards = [
    {
      icon: '📦',
      title: 'Orders',
      desc: 'View and manage your orders',
      path: '/orders',
      show: true,
    },
    {
      icon: '👥',
      title: 'User Management',
      desc: 'Manage users, roles, and access',
      path: '/admin/users',
      show: isAdmin,
    },
  ].filter((c) => c.show)

  return (
    <>
      <div className="welcome-banner">
        <h2>Welcome back, {firstName} 👋</h2>
        <p>
          Signed in as <strong>{user?.email}</strong> · Role:{' '}
          <strong>{user?.role}</strong>
        </p>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon">🎭</div>
          <div className="stat-label">Role</div>
          <div className="stat-value" style={{ fontSize: 18 }}>
            {user?.role}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-label">Status</div>
          <div className="stat-value" style={{ fontSize: 18, color: 'var(--success)' }}>
            Active
          </div>
        </div>
      </div>

      <p className="section-title">Quick navigation</p>
      <div className="nav-cards">
        {navCards.map((card) => (
          <button key={card.path} className="nav-card" onClick={() => navigate(card.path)}>
            <div className="nav-card-icon">{card.icon}</div>
            <div className="nav-card-title">{card.title}</div>
            <div className="nav-card-desc">{card.desc}</div>
          </button>
        ))}
      </div>
    </>
  )
}
