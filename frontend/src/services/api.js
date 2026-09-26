import { useEffect, useRef } from 'react'

// Detect if frontend is served from the same origin as the backend
// (production: backend serves frontend static files) or a different origin
// (dev: separate frontend:3000 + backend:8080 via vite proxy)
const isSameOrigin = () => {
  try {
    const url = new URL(import.meta.env.VITE_API_URL || window.location.origin)
    return url.origin === window.location.origin
  } catch {
    return false
  }
}

export const BASE = isSameOrigin()
  ? ''  // same origin — use relative paths
  : (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
export const API_URL = `${BASE}/api`
export const WS_URL = `${BASE.replace(/^http/, 'ws')}/ws`

// Read JWT from localStorage — used as fallback when React state
// (useAuth().token) hasn't hydrated yet on initial page load.
function getAuthHeader() {
  const token = localStorage.getItem('token')
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

// Redirect to login when a 401 is received
function handle401() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  window.location.assign('/login')
}

export const authAPI = {
  register: (data) =>
    fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(res => res.json()),

  login: (data) =>
    fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(res => res.json()),

  googleAuth: (idToken) =>
    fetch(`${API_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }).then(res => res.json()),

  me: (token) =>
    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => res.json()),
}

export const pollAPI = {
  create: (data, token) =>
    fetch(`${API_URL}/polls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : getAuthHeader()),
      },
      body: JSON.stringify(data),
    }).then(res => {
      if (res.status === 401) handle401()
      return res.json()
    }),

  getAll: () =>
    fetch(`${API_URL}/polls`).then(res => res.json()),

  getOne: (id) => {
    let voterId = ''
    try {
      const token = localStorage.getItem('token')
      if (token) {
        const payload = token.split('.')[1]
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
        const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=')
        const decoded = JSON.parse(atob(padded))
        voterId = 'user_' + decoded.userId
      }
      if (!voterId) {
        voterId = localStorage.getItem('pollaris_voter_id') || ''
      }
    } catch { /* ignore */ }

    const headers = {}
    if (voterId) headers['X-Voter-Id'] = voterId

    return fetch(`${API_URL}/polls/${id}`, { headers }).then(res => res.json())
  },

  getMyPolls: (token) =>
    fetch(`${API_URL}/polls/my`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : getAuthHeader()) },
    }).then(res => res.json()),

  getMyVotes: (token) =>
    fetch(`${API_URL}/polls/my-votes`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : getAuthHeader()) },
    }).then(res => res.json()),

  vote: (data, token) => {
    let voterId = ''
    try {
      if (token) {
        const payload = token.split('.')[1]
        const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
        const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=')
        const decoded = JSON.parse(atob(padded))
        voterId = 'user_' + decoded.userId
      }
      if (!voterId) {
        voterId = localStorage.getItem('pollaris_voter_id')
        if (!voterId) {
          voterId = 'v_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10)
          localStorage.setItem('pollaris_voter_id', voterId)
        }
      }
    } catch {
      voterId = ''
    }

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
    }
    if (voterId) headers['X-Voter-Id'] = voterId

    return fetch(`${API_URL}/polls/vote`, {
      headers,
      body: JSON.stringify(data),
      method: 'POST',
    }).then(res => res.json())
  },

  toggle: (id, isActive, token) =>
    fetch(`${API_URL}/polls/${id}/toggle`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token || ''}`,
      },
      body: JSON.stringify({ isActive }),
    }).then(res => {
      if (res.status === 401) handle401()
      return res.json()
    }),

  delete: (id, token) =>
    fetch(`${API_URL}/polls/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token || ''}` },
    }).then(res => {
      if (res.status === 401) handle401()
      return res.json()
    }),
}

export function useWebSocket(pollId, onMessage) {
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)

  useEffect(() => {
    if (!pollId) return

    const wsUrl = `${WS_URL}?pollId=${pollId}`

    const connect = () => {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected')
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          onMessage && onMessage(msg)
        } catch (e) {
          console.error('WebSocket message parse error:', e)
        }
      }

      ws.onerror = (err) => {
        console.error('WebSocket error:', err)
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected, reconnecting in 3s...')
        reconnectTimeoutRef.current = setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [pollId, onMessage])
}
