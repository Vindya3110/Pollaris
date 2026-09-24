import { useEffect, useRef, useCallback, useState } from 'react'

export function useWebSocket(url, pollId, username) {
  const ws = useRef(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const reconnectTimeout = useRef(null)
  const reconnectAttempts = useRef(0)
  const maxReconnect = 5

  const connect = useCallback(() => {
    if (!pollId) return

    // Build WebSocket URL — go through Vite proxy in dev, direct in prod
    let wsUrl
    if (url) {
      wsUrl = url
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host
      wsUrl = `${protocol}//${host}/api/ws?pollId=${pollId}&username=${encodeURIComponent(username || 'Anonymous')}`
    }

    try {
      ws.current = new WebSocket(wsUrl)

      ws.current.onopen = () => {
        console.log('[WS] Connected to poll:', pollId)
        setIsConnected(true)
        reconnectAttempts.current = 0
      }

      ws.current.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          console.log('[WS] Received:', msg)
          if (msg.type === 'poll_update') {
            setLastUpdate(msg.payload)
          }
        } catch (e) {
          console.error('[WS] Failed to parse message:', e)
        }
      }

      ws.current.onclose = () => {
        console.log('[WS] Disconnected')
        setIsConnected(false)

        // Auto-reconnect with backoff
        if (reconnectAttempts.current < maxReconnect) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current++
            connect()
          }, delay)
        }
      }

      ws.current.onerror = (err) => {
        console.error('[WS] Error:', err)
      }
    } catch (e) {
      console.error('[WS] Connection failed:', e)
    }
  }, [url, pollId, username])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current)
      }
      if (ws.current) {
        ws.current.close()
        ws.current = null
      }
    }
  }, [connect])

  const send = useCallback((data) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data))
    }
  }, [])

  return { isConnected, lastUpdate, send }
}
