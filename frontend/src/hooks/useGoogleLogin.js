import { useCallback, useState } from 'react'
import { authAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

// Load Google Identity Services script once
let googleScriptLoaded = false
let googleInitPromise = null

function loadGoogleScript() {
  if (googleScriptLoaded) return Promise.resolve()
  if (googleInitPromise) return googleInitPromise

  googleInitPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      googleScriptLoaded = true
      resolve()
    }
    script.onerror = () => reject(new Error('Failed to load Google script'))
    document.head.appendChild(script)
  })

  return googleInitPromise
}

export function useGoogleLogin() {
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleGoogleSuccess = useCallback(async (credentialResponse) => {
    setLoading(true)
    try {
      const idToken = credentialResponse.credential
      const res = await authAPI.googleAuth(idToken)

      if (res.token) {
        login(res.token, res.user)
        toast.success(`Welcome, ${res.user.name}!`)
        setTimeout(() => navigate('/'), 100)
      } else {
        toast.error(res.error || 'Google sign-in failed')
      }
    } catch (err) {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [login, navigate])

  const initGoogle = useCallback(async (elementId, clientId) => {
    try {
      await loadGoogleScript()

      if (!window.google?.accounts?.id) {
        toast.error('Google Sign-In is not available')
        return
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleSuccess,
        auto_select: false,
        cancel_on_tap_outside: false,
      })

      // Render the Google button into the specified element
      window.google.accounts.id.renderButton(
        document.getElementById(elementId),
        {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'continue_with',
        }
      )
    } catch (err) {
      console.error('Google init error:', err)
      toast.error('Failed to load Google Sign-In')
    }
  }, [handleGoogleSuccess])

  return { loading, initGoogle }
}
