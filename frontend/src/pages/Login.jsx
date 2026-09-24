import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { useGoogleLogin } from '../hooks/useGoogleLogin'

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const { initGoogle } = useGoogleLogin()

  // Render Google button after mount
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (clientId) {
      initGoogle('google-login-btn', clientId)
    }
  }, [initGoogle])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const res = await authAPI.login(formData)
    if (res.token) {
      login(res.token, res.user)
      toast.success('Welcome back!')
      navigate('/')
    } else {
      toast.error(res.error || 'Login failed')
    }
    setLoading(false)
  }

  const hasGoogleClient = !!import.meta.env.VITE_GOOGLE_CLIENT_ID

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4">
        <div className="glass rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
          <p className="text-gray-600 mb-6">Sign in to manage your polls</p>

          {hasGoogleClient && (
            <>
              <div id="google-login-btn" className="flex justify-center mb-4"></div>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white/60 text-gray-500">Or continue with email</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Min 6 characters"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In with Email'}
            </button>
          </form>

          {!hasGoogleClient && (
            <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              💡 Add <code>VITE_GOOGLE_CLIENT_ID</code> to <code>.env</code> to enable Google Sign-In.
            </div>
          )}

          <p className="mt-6 text-center text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 hover:text-indigo-800 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
