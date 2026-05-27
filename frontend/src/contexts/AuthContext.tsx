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
    const storedToken = sessionStorage.getItem('pamana_token')
    const storedUser = sessionStorage.getItem('pamana_user')
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
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
    joinCode?: string
  ) => {
    const response = await api.post('/auth/register', { name, email, password, joinCode })
    const { token: jwt, user: userData } = response.data
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
