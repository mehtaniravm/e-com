import axiosInstance from './axiosInstance'
import type { User, UserUpdateRequest } from '@/types'

export const getAllUsers = () =>
  axiosInstance.get<User[]>('/api/users')

export const getUserById = (id: string) =>
  axiosInstance.get<User>(`/api/users/${id}`)

export const updateUser = (id: string, data: UserUpdateRequest) =>
  axiosInstance.put<User>(`/api/users/${id}`, data)

export const deleteUser = (id: string) =>
  axiosInstance.delete(`/api/users/${id}`)
