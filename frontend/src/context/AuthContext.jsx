import React, { createContext, useContext, useState, useEffect } from 'react'
import { API_URL } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('user')
      return cached ? JSON.parse(cached) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  // initializeAuth sets state from an already-authenticated response
  // (called by pages that already fetched via authAPI)
  const initializeAuth = (token, user) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    setToken(token)
    setUser(user)
  }

  useEffect(() => {
    if (token) {
      if (user) {
        setLoading(false)
        return
      }
      fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => {
          if (!res.ok) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            setToken(null)
            setUser(null)
            return null
          }
          return res.json()
        })
        .then(data => {
          if (data && data.id) {
            setUser(data)
            localStorage.setItem('user', JSON.stringify(data))
          }
        })
        .catch(() => {
          setLoading(false)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token, user])

  // login sets auth from already-fetched data (pages call authAPI.login first)
  const login = (token, user) => {
    initializeAuth(token, user)
  }

  // register sets auth from already-fetched data (pages call authAPI.register first)
  const register = (token, user) => {
    initializeAuth(token, user)
  }

  // googleLogin sets auth from already-fetched data (pages call authAPI.googleAuth first)
  const googleLogin = (token, user) => {
    initializeAuth(token, user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
