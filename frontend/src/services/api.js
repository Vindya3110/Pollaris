import { useEffect, useRef } from 'react'

// API base from Vite build-time env, or empty string as fallback
const rawBase = import.meta.env.VITE_API_URL || ''
const API_URL = rawBase ? `${rawBase}/api` : '/api'
const WS_URL = rawBase ? `${rawBase.replace(/^http/, 'ws')}/ws` : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`

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
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }).then(res => res.json()),

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
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => res.json()),

  getMyVotes: (token) =>
    fetch(`${API_URL}/polls/my-votes`, {
      headers: { Authorization: `Bearer ${token}` },
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
      Authorization: `Bearer ${token}`,
    }
    if (voterId) headers['X-Voter-Id'] = voterId

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
    const wsUrl = `${WS_URL}?pollId=${pollId}`

    const connect = () => {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      ws.onopen = () => console.log('WebSocket connected')
      ws.onmessage = (event) => {
        try { onMessage && onMessage(JSON.parse(event.data)) }
        catch (e) { console.error('WebSocket parse error:', e) }
      }
      ws.onerror = (err) => console.error('WebSocket error:', err)
      ws.onclose = () => {
        console.log('WebSocket reconnecting in 3s...')
        reconnectTimeoutRef.current = setTimeout(connect, 3000)
      }
    }
    connect()
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null }
    }
  }, [pollId, onMessage])
}
