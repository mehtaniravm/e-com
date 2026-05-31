import { useEffect, useState } from 'react'
import type { Order, OrderStatus } from '@/types'
import { getOrdersByUser, createOrder, cancelOrder, updateOrderStatus } from '@/api/orderApi'
import { useAuth } from '@/context/AuthContext'
import { StatusBadge } from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'

interface ItemForm {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
}

const emptyItem = (): ItemForm => ({
  productId: crypto.randomUUID(),
  productName: '',
  quantity: 1,
  unitPrice: 0,
})

// ── Timeline ─────────────────────────────────────────────────────────────────

const FLOW: OrderStatus[] = ['PENDING', 'CONFIRMED', 'SHIPPED']

function StatusTimeline({ status }: { status: OrderStatus }) {
  const cancelled = status === 'CANCELLED'
  const currentIdx = FLOW.indexOf(status)

  return (
    <div>
      <p className="section-title">Order progress</p>
      <div className="timeline">
        {FLOW.map((step, idx) => {
          const isDone = !cancelled && currentIdx > idx
          const isCurrent = !cancelled && currentIdx === idx
          return (
            <div key={step} style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
              <div className="tl-step">
                <div className={`tl-dot${isDone ? ' done' : isCurrent ? ' current' : ''}`}>
                  {isDone ? '✓' : idx + 1}
                </div>
                <div className={`tl-label${isDone ? ' done' : ''}`}>{step}</div>
              </div>
              {idx < FLOW.length - 1 && (
                <div className={`tl-connector${isDone ? ' done' : ''}`} />
              )}
            </div>
          )
        })}
      </div>
      {cancelled && (
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <span className="badge badge-cancelled" style={{ fontSize: 12 }}>✕ Order cancelled</span>
        </div>
      )}
    </div>
  )
}

// ── Order detail modal ────────────────────────────────────────────────────────

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'SHIPPED',
}

interface DetailModalProps {
  order: Order
  isAdmin: boolean
  onClose: () => void
  onStatusUpdated: (updated: Order) => void
  onCancelled: (id: string) => void
}

function OrderDetailModal({ order, isAdmin, onClose, onStatusUpdated, onCancelled }: DetailModalProps) {
  const [advancing, setAdvancing] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const canAdvance = NEXT_STATUS[order.status] !== undefined
  const canCancel = order.status === 'PENDING' || order.status === 'CONFIRMED'

  const handleAdvance = async () => {
    const next = NEXT_STATUS[order.status]
    if (!next) return
    setAdvancing(true)
    setActionError(null)
    try {
      const { data } = await updateOrderStatus(order.id, next)
      onStatusUpdated(data)
    } catch {
      setActionError('Failed to update status.')
    } finally {
      setAdvancing(false)
    }
  }

  const handleCancel = async () => {
    setCancelling(true)
    setActionError(null)
    try {
      await cancelOrder(order.id)
      onCancelled(order.id)
      onClose()
    } catch {
      setActionError('Failed to cancel order.')
    } finally {
      setCancelling(false)
    }
  }

  const footer = (
    <>
      {isAdmin && canAdvance && (
        <button className="btn btn-primary btn-sm" onClick={handleAdvance} disabled={advancing}>
          {advancing ? <Spinner size="sm" /> : `→ Mark ${NEXT_STATUS[order.status]}`}
        </button>
      )}
      {canCancel && (
        <button className="btn btn-danger btn-sm" onClick={handleCancel} disabled={cancelling}>
          {cancelling ? <Spinner size="sm" /> : 'Cancel order'}
        </button>
      )}
      <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
    </>
  )

  return (
    <Modal title="Order details" onClose={onClose} footer={footer} size="lg">
      {actionError && <div className="alert alert-error">{actionError}</div>}

      <div className="order-meta">
        <div className="order-meta-item">
          <label>Order ID</label>
          <div className="value" style={{ fontSize: 12, fontFamily: 'monospace' }}>
            {order.id.slice(0, 8)}…
          </div>
        </div>
        <div className="order-meta-item">
          <label>Status</label>
          <div className="value"><StatusBadge status={order.status} /></div>
        </div>
        <div className="order-meta-item">
          <label>Total</label>
          <div className="value">${Number(order.totalAmount).toFixed(2)}</div>
        </div>
        <div className="order-meta-item">
          <label>Placed</label>
          <div className="value" style={{ fontSize: 13 }}>
            {new Date(order.createdAt).toLocaleString()}
          </div>
        </div>
      </div>

      <StatusTimeline status={order.status} />

      <div style={{ marginTop: 24 }}>
        <p className="section-title">Items ({order.items.length})</p>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit price</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.productName}</td>
                  <td>{item.quantity}</td>
                  <td>${Number(item.unitPrice).toFixed(2)}</td>
                  <td>${Number(item.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="items-total">Total: ${Number(order.totalAmount).toFixed(2)}</div>
      </div>
    </Modal>
  )
}

// ── Create order modal ────────────────────────────────────────────────────────

interface CreateModalProps {
  userId: string
  onClose: () => void
  onCreated: (order: Order) => void
}

function CreateOrderModal({ userId, onClose, onCreated }: CreateModalProps) {
  const [items, setItems] = useState<ItemForm[]>([emptyItem()])
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)

  const updateItem = (idx: number, field: keyof ItemForm, value: string | number) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)))
  }

  const handleSubmit = async () => {
    if (items.some((i) => !i.productName.trim() || i.unitPrice <= 0 || i.quantity < 1)) {
      setError('Please fill in all item fields with valid values.')
      return
    }
    setCreating(true)
    setError(null)
    try {
      const { data } = await createOrder({ userId, items })
      onCreated(data)
      onClose()
    } catch {
      setError('Failed to create order.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Modal
      title="New order"
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={creating}>
            {creating ? <Spinner size="sm" /> : 'Place order'}
          </button>
        </>
      }
    >
      {error && <div className="alert alert-error">{error}</div>}

      <div className="items-header">
        <span>Product name</span>
        <span>Qty</span>
        <span>Unit price</span>
        <span />
      </div>

      {items.map((item, idx) => (
        <div key={item.productId} className="item-row">
          <input
            placeholder="Product name"
            value={item.productName}
            onChange={(e) => updateItem(idx, 'productName', e.target.value)}
          />
          <input
            type="number"
            min={1}
            value={item.quantity}
            onChange={(e) => updateItem(idx, 'quantity', Math.max(1, Number(e.target.value)))}
          />
          <input
            type="number"
            min={0}
            step={0.01}
            placeholder="0.00"
            value={item.unitPrice || ''}
            onChange={(e) => updateItem(idx, 'unitPrice', Number(e.target.value))}
          />
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
            disabled={items.length === 1}
            title="Remove item"
          >
            ✕
          </button>
        </div>
      ))}

      <button className="add-item-btn" onClick={() => setItems((prev) => [...prev, emptyItem()])}>
        + Add item
      </button>

      <div className="items-total">Order total: ${total.toFixed(2)}</div>
    </Modal>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const { user, isAdmin } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const fetchOrders = async () => {
    if (!user) return
    try {
      setLoading(true)
      const { data } = await getOrdersByUser(user.id)
      setOrders(data)
    } catch {
      setError('Failed to load orders.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrders() }, [user?.id])

  const handleOrderCreated = (order: Order) => setOrders((prev) => [order, ...prev])

  const handleStatusUpdated = (updated: Order) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
    setSelectedOrder(updated)
  }

  const handleCancelled = (id: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: 'CANCELLED' as OrderStatus } : o)),
    )
  }

  if (loading) return <Spinner center />

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">{orders.length} order{orders.length !== 1 ? 's' : ''} found</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + New order
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        {orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <div className="empty-title">No orders yet</div>
            <div className="empty-sub">Place your first order to get started.</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Status</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="row-clickable" onClick={() => setSelectedOrder(order)}>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontSize: 13 }}>
                        {order.id.slice(0, 8)}…
                      </span>
                    </td>
                    <td><StatusBadge status={order.status} /></td>
                    <td style={{ color: 'var(--muted)' }}>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td>
                    <td style={{ fontWeight: 600 }}>${Number(order.totalAmount).toFixed(2)}</td>
                    <td style={{ color: 'var(--muted)', fontSize: 13 }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          isAdmin={isAdmin}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdated={handleStatusUpdated}
          onCancelled={handleCancelled}
        />
      )}

      {showCreateModal && user && (
        <CreateOrderModal
          userId={user.id}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleOrderCreated}
        />
      )}
    </>
  )
}
