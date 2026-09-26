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

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (data.token) {
      localStorage.setItem('token', data.token)
      setToken(data.token)
      setUser(data.user)
      localStorage.setItem('user', JSON.stringify(data.user))
    }
    await new Promise(r => setTimeout(r, 50))
    window.location.assign('/')
  }

  const register = async (name, email, password) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    const data = await res.json()
    if (data.token) {
      localStorage.setItem('token', data.token)
      setToken(data.token)
      setUser(data.user)
      localStorage.setItem('user', JSON.stringify(data.user))
    }
    await new Promise(r => setTimeout(r, 50))
    window.location.assign('/')
  }

  const googleLogin = async (idToken) => {
    const res = await fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    })
    const data = await res.json()
    if (data.token) {
      localStorage.setItem('token', data.token)
      setToken(data.token)
      setUser(data.user)
      localStorage.setItem('user', JSON.stringify(data.user))
    }
    await new Promise(r => setTimeout(r, 50))
    window.location.assign('/')
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
