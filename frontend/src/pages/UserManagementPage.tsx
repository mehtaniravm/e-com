import { useEffect, useState } from 'react'
import type { Role, User } from '@/types'
import { getAllUsers, updateUser } from '@/api/userApi'
import { StatusBadge as _, RoleBadge, ActiveBadge } from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'

interface EditForm {
  firstName: string
  lastName: string
  role: Role
  enabled: boolean
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({ firstName: '', lastName: '', role: 'USER', enabled: true })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data } = await getAllUsers()
      setUsers(data)
    } catch {
      setError('Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase()
    return (
      u.email.toLowerCase().includes(q) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q)
    )
  })

  const openEdit = (user: User) => {
    setEditingUser(user)
    setEditForm({ firstName: user.firstName, lastName: user.lastName, role: user.role, enabled: user.enabled })
    setSaveError(null)
  }

  const handleSave = async () => {
    if (!editingUser) return
    setSaving(true)
    setSaveError(null)
    try {
      const { data } = await updateUser(editingUser.id, editForm)
      setUsers((prev) => prev.map((u) => (u.id === data.id ? data : u)))
      setEditingUser(null)
    } catch {
      setSaveError('Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (user: User) => {
    try {
      const { data } = await updateUser(user.id, {
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        enabled: !user.enabled,
      })
      setUsers((prev) => prev.map((u) => (u.id === data.id ? data : u)))
    } catch {
      setError('Failed to toggle user status.')
    }
  }

  if (loading) return <Spinner center />

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">{users.length} registered users</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="toolbar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="Search by name or email…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>
            {filteredUsers.length} result{filteredUsers.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👤</div>
            <div className="empty-title">No users found</div>
            <div className="empty-sub">Try a different search term.</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {user.firstName} {user.lastName}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                        {user.id.slice(0, 8)}…
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td><RoleBadge role={user.role} /></td>
                    <td>
                      <label className="toggle" title={user.enabled ? 'Deactivate user' : 'Activate user'}>
                        <input
                          type="checkbox"
                          checked={user.enabled}
                          onChange={() => handleToggleStatus(user)}
                        />
                        <span className="toggle-track">
                          <span className="toggle-thumb" />
                        </span>
                        <span className="toggle-label">
                          <ActiveBadge enabled={user.enabled} />
                        </span>
                      </label>
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: 13 }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(user)}>
                        ✏️ Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <Modal
          title={`Edit — ${editingUser.firstName} ${editingUser.lastName}`}
          onClose={() => setEditingUser(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setEditingUser(null)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <Spinner size="sm" /> : 'Save changes'}
              </button>
            </>
          }
        >
          {saveError && <div className="alert alert-error">{saveError}</div>}

          <div className="form-row">
            <div className="form-group">
              <label>First name</label>
              <input
                value={editForm.firstName}
                onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Last name</label>
              <input
                value={editForm.lastName}
                onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Role</label>
            <div className="chip-group">
              {(['USER', 'ADMIN'] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`chip chip-${r.toLowerCase()}${editForm.role === r ? ' selected' : ''}`}
                  onClick={() => setEditForm((f) => ({ ...f, role: r }))}
                >
                  {r === 'ADMIN' ? '👑 Admin' : '👤 User'}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Account status</label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={editForm.enabled}
                onChange={(e) => setEditForm((f) => ({ ...f, enabled: e.target.checked }))}
              />
              <span className="toggle-track">
                <span className="toggle-thumb" />
              </span>
              <span className="toggle-label" style={{ fontSize: 14 }}>
                {editForm.enabled ? 'Active — user can sign in' : 'Inactive — sign-in blocked'}
              </span>
            </label>
          </div>
        </Modal>
      )}
    </>
  )
}
