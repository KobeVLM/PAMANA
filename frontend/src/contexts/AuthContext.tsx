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
        const parsed: User = JSON.parse(storedUser)
        setToken(storedToken)
        setUser(parsed)
        if (parsed.gender) {
          localStorage.setItem('pamana_character', parsed.gender)
        }
      } else if (storedUser === 'undefined' || storedUser === '{}') {
        sessionStorage.removeItem('pamana_token')
        sessionStorage.removeItem('pamana_user')
      }
    } catch {
      sessionStorage.removeItem('pamana_token')
      sessionStorage.removeItem('pamana_user')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password })
    const { token: jwt, user: userData } = response.data
    sessionStorage.setItem('pamana_token', jwt)
    sessionStorage.setItem('pamana_user', JSON.stringify(userData))
    if (userData.gender) {
      localStorage.setItem('pamana_character', userData.gender)
      window.dispatchEvent(new Event('pamana_settings_changed'))
    }
    setToken(jwt)
    setUser(userData)
  }, [])

  const register = useCallback(async (
    arg1: string,
    arg2: string,
    arg3: 'LEARNER' | 'PARENT' | string,
    arg4?: string | 'LEARNER' | 'PARENT',
    arg5?: 'Lalaki' | 'Babae'
  ) => {
    if (arg3 === 'LEARNER' || arg3 === 'PARENT') {
      // New signature: register(username, password, role, name, gender)
      await api.post('/auth/register', {
        username: arg1,
        password: arg2,
        role: arg3,
        name: arg4 as string | undefined,
        gender: arg5,
      })
    } else {
      // Legacy signature: register(name, email, password, role)
      await api.post('/auth/register', {
        name: arg1,
        username: arg2,
        password: arg3,
        role: arg4 as 'LEARNER' | 'PARENT',
      })
    }
  }, []) as AuthContextType['register']

  const updateProfile = useCallback(async (name: string, gender?: 'Lalaki' | 'Babae') => {
    const response = await api.put('/auth/profile', { name, gender })
    const updatedUser: User = response.data
    sessionStorage.setItem('pamana_user', JSON.stringify(updatedUser))
    if (gender) {
      localStorage.setItem('pamana_character', gender)
      window.dispatchEvent(new Event('pamana_settings_changed'))
    }
    setUser(updatedUser)
    return updatedUser
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem('pamana_token')
    sessionStorage.removeItem('pamana_user')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
