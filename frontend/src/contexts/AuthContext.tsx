import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'
import type { User, AuthContextType } from '@/types'

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Hydrate from session storage on mount
  useEffect(() => {
    try {
      const storedToken = sessionStorage.getItem('pamana_token')
      const storedUser = sessionStorage.getItem('pamana_user')
      if (storedToken && storedUser && storedUser !== 'undefined' && storedUser !== '{}') {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } else if (storedUser === 'undefined' || storedUser === '{}') {
        sessionStorage.removeItem('pamana_token')
        sessionStorage.removeItem('pamana_user')
      }
    } catch (e) {
      sessionStorage.removeItem('pamana_token')
      sessionStorage.removeItem('pamana_user')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    const { token: jwt, user: userData } = response.data
    sessionStorage.setItem('pamana_token', jwt)
    sessionStorage.setItem('pamana_user', JSON.stringify(userData))
    setToken(jwt)
    setUser(userData)
  }, [])

  const register = useCallback(async (
    name: string,
    email: string,
    password: string,
    role: 'LEARNER' | 'PARENT' | 'TEACHER',
    joinCode?: string
  ) => {
    // 1. Register the user
    await api.post('/auth/register', { name, email, password, role, joinCode })
    
    // 2. Automatically log them in to get the JWT token
    const loginResponse = await api.post('/auth/login', { email, password })
    const { token: jwt, user: userData } = loginResponse.data
    
    sessionStorage.setItem('pamana_token', jwt)
    sessionStorage.setItem('pamana_user', JSON.stringify(userData))
    setToken(jwt)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem('pamana_token')
    sessionStorage.removeItem('pamana_user')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
