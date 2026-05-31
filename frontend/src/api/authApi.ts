import axiosInstance from './axiosInstance'
import type { LoginResponse } from '@/types'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
}

export const login = (data: LoginRequest) =>
  axiosInstance.post<LoginResponse>('/api/auth/login', data)

export const register = (data: RegisterRequest) =>
  axiosInstance.post('/api/auth/register', data)
