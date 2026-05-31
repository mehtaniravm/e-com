import type { OrderStatus, Role } from '@/types'

interface StatusBadgeProps {
  status: OrderStatus
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  CANCELLED: 'Cancelled',
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`badge badge-${status.toLowerCase()}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}

interface RoleBadgeProps {
  role: Role
}

export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <span className={`badge badge-${role.toLowerCase()}`}>
      {role}
    </span>
  )
}

interface ActiveBadgeProps {
  enabled: boolean
}

export function ActiveBadge({ enabled }: ActiveBadgeProps) {
  return (
    <span className={`badge ${enabled ? 'badge-active' : 'badge-inactive'}`}>
      {enabled ? 'Active' : 'Inactive'}
    </span>
  )
}
