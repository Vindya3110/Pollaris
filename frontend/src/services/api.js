import { useEffect, useRef } from 'react'

const API_URL = `${import.meta.env.VITE_API_URL || ''}/api`
const WS_URL = (import.meta.env.VITE_API_URL || '').replace(/^http/, 'ws')

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

  // Exchange Google ID token for our app JWT
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
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }).then(res => res.json()),

  getAll: () =>
    fetch(`${API_URL}/polls`).then(res => res.json()),

  getOne: (id) => {
    // Send voter ID so backend can check if THIS viewer has voted
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
    } catch {
      // ignore
    }

    const headers = {}
    if (voterId) headers['X-Voter-Id'] = voterId

    return fetch(`${API_URL}/polls/${id}`, { headers }).then(res => res.json())
  },

  getMy: (token) =>
    fetch(`${API_URL}/polls/my`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => res.json()),

  getMyVotes: (token) =>
    fetch(`${API_URL}/polls/my-votes`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => res.json()),

  vote: (data, token) => {
    // Priority for voter ID:
    // 1. Authenticated user's account ID — so two different accounts
    //    in the same browser each get their own vote
    // 2. Browser-based localStorage ID — for anonymous voters,
    //    distinguishes different browsers/devices
    let voterId = ''
    try {
      if (token) {
        // JWT uses base64url encoding; atob() needs standard base64
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
      Authorization: `Bearer ${token}`,
    }
    if (voterId) {
      headers['X-Voter-Id'] = voterId
    }

    return fetch(`${API_URL}/polls/vote`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    }).then(res => res.json())
  },

  toggle: (id, isActive, token) =>
    fetch(`${API_URL}/polls/${id}/toggle`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isActive }),
    }).then(res => res.json()),

  delete: (id, token) =>
    fetch(`${API_URL}/polls/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => res.json()),
}

export function useWebSocket(pollId, onMessage) {
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)

  useEffect(() => {
    if (!pollId) return

    const token = localStorage.getItem('token')
    const wsUrl = `${WS_URL}/ws?pollId=${pollId}`

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
