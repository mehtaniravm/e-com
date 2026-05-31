export type Role = 'USER' | 'ADMIN'
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'CANCELLED'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
  enabled: boolean
  createdAt: string
}

export interface LoginResponse {
  accessToken: string
  tokenType: string
  userId: string
  email: string
  role: string
}

export interface OrderItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface Order {
  id: string
  userId: string
  status: OrderStatus
  totalAmount: number
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

export interface CreateOrderRequest {
  userId: string
  items: {
    productId: string
    productName: string
    quantity: number
    unitPrice: number
  }[]
}

export interface UserUpdateRequest {
  firstName: string
  lastName: string
  enabled: boolean
  role: Role
}
