import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { useGoogleLogin } from '../hooks/useGoogleLogin'
import { LogIn, Mail, Lock, Vote } from 'lucide-react'

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const { initGoogle } = useGoogleLogin()

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
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-12">
        <div className="glass rounded-3xl shadow-2xl p-8 md:p-10 w-full max-w-md animate-fade-in-up">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary mb-4 shadow-lg">
              <Vote className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-indigo-200/70">Sign in to manage your polls</p>
          </div>

          {hasGoogleClient && (
            <>
              <div id="google-login-btn" className="flex justify-center mb-6"></div>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 text-indigo-300/70" style={{ background: 'transparent' }}>or continue with email</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-indigo-200 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field w-full pl-11 pr-4 py-3 rounded-xl text-gray-800"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-indigo-200 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input-field w-full pl-11 pr-4 py-3 rounded-xl text-gray-800"
                  placeholder="Your password"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-white py-3.5 rounded-xl font-bold text-base disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {!hasGoogleClient && (
            <div className="mt-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-300">
              💡 Add <code className="bg-amber-500/20 px-1 rounded">VITE_GOOGLE_CLIENT_ID</code> to <code className="bg-amber-500/20 px-1 rounded">.env</code> to enable Google Sign-In.
            </div>
          )}

          <p className="mt-8 text-center text-indigo-200/70">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Sign up →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
