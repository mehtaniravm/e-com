import axiosInstance from './axiosInstance'
import type { Order, CreateOrderRequest, OrderStatus } from '@/types'

export const createOrder = (data: CreateOrderRequest) =>
  axiosInstance.post<Order>('/api/orders', data)

export const getOrder = (id: string) =>
  axiosInstance.get<Order>(`/api/orders/${id}`)

export const getOrdersByUser = (userId: string) =>
  axiosInstance.get<Order[]>(`/api/orders/user/${userId}`)

export const updateOrderStatus = (id: string, status: OrderStatus) =>
  axiosInstance.put<Order>(`/api/orders/${id}/status`, { status })

export const cancelOrder = (id: string) =>
  axiosInstance.delete(`/api/orders/${id}`)
