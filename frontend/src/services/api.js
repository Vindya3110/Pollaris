import { useEffect, useRef } from 'react'

const API_URL = '/api'

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

  getOne: (id) =>
    fetch(`${API_URL}/polls/${id}`).then(res => res.json()),

  getMy: (token) =>
    fetch(`${API_URL}/polls/my`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => res.json()),

  vote: (data, token) =>
    fetch(`${API_URL}/polls/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }).then(res => res.json()),

  toggle: (id, isActive, token) =>
    fetch(`${API_URL}/polls/${id}/toggle`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isActive }),
    }).then(res => res.json()),
}

export function useWebSocket(pollId, onMessage) {
  const wsRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)

  useEffect(() => {
    if (!pollId) return

    const token = localStorage.getItem('token')
    const wsUrl = `ws://${window.location.host}/ws?pollId=${pollId}`

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
