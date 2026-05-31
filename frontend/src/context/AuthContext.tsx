import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { LoginResponse } from '@/types'

interface AuthUser {
  id: string
  email: string
  role: string
}

interface AuthContextType {
  token: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (response: LoginResponse) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const TOKEN_KEY = 'access_token'
const USER_KEY = 'auth_user'

function isTokenExpired(token: string): boolean {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const { exp } = JSON.parse(atob(base64)) as { exp?: number }
    return exp ? exp * 1000 < Date.now() : true
  } catch {
    return true
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)

  // Rehydrate from localStorage on first mount
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)
    if (storedToken && storedUser && !isTokenExpired(storedToken)) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    } else {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    }
  }, [])

  const login = (response: LoginResponse) => {
    const authUser: AuthUser = {
      id: response.userId,
      email: response.email,
      role: response.role,
    }
    localStorage.setItem(TOKEN_KEY, response.accessToken)
    localStorage.setItem(USER_KEY, JSON.stringify(authUser))
    setToken(response.accessToken)
    setUser(authUser)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ token, user, isAuthenticated: !!token, isAdmin: user?.role === 'ADMIN', login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
