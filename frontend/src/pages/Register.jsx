import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { useGoogleLogin } from '../hooks/useGoogleLogin'
import { UserPlus, Mail, Lock, User, Vote } from 'lucide-react'

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const { initGoogle } = useGoogleLogin()

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

  useEffect(() => {
    if (clientId) {
      initGoogle('google-register-btn', clientId)
    }
  }, [initGoogle, clientId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const res = await authAPI.register(formData)
    if (res.token) {
      login(res.token, res.user)
      toast.success('Account created successfully!')
      navigate('/')
    } else {
      toast.error(res.error || 'Registration failed')
    }
    setLoading(false)
  }

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
            <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
            <p className="text-indigo-200/70">Join Pollaris and start creating polls</p>
          </div>

          {clientId && (
            <>
              <div id="google-register-btn" className="flex justify-center mb-6"></div>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 text-indigo-300/70">or sign up with email</span>
                </div>
              </div>
            </>
          )}

          {!clientId && (
            <p className="text-center text-indigo-200/50 text-sm mb-6">
              Sign up with your email to get started
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-indigo-200 mb-2">Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field w-full pl-11 pr-4 py-3 rounded-xl text-gray-800"
                  placeholder="Your name"
                  required
                  minLength={2}
                />
              </div>
            </div>

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
                  placeholder="Min 6 characters"
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
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Sign Up
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-indigo-200/70">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
