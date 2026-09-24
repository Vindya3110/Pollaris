import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogOut, User, Vote, Menu } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="sticky top-0 z-50" style={{ background: 'rgba(15, 12, 41, 0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg group-hover:shadow-indigo-500/30 transition-shadow">
              <Vote className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Pollaris</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {user ? (
              <>
                <Link
                  to="/create"
                  className="btn-primary text-white px-4 py-2 rounded-lg font-medium text-sm"
                >
                  Create Poll
                </Link>
                <Link
                  to="/my-polls"
                  className="nav-link text-indigo-200 hover:text-white px-3 py-2 font-medium text-sm"
                >
                  My Polls
                </Link>
                <div className="flex items-center gap-2 text-gray-300 ml-2 pl-2" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center text-white text-xs font-bold">
                    {user.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{user.name}</span>
                  <button
                    onClick={handleLogout}
                    className="ml-2 p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="nav-link text-indigo-200 hover:text-white px-3 py-2 font-medium text-sm"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-white px-5 py-2 rounded-lg font-medium text-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-gray-300 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden pb-4 pt-2 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {user ? (
              <>
                <Link to="/create" className="block px-3 py-2 text-indigo-200 hover:text-white font-medium text-sm rounded-lg hover:bg-white/5">Create Poll</Link>
                <Link to="/my-polls" className="block px-3 py-2 text-indigo-200 hover:text-white font-medium text-sm rounded-lg hover:bg-white/5">My Polls</Link>
                <button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-red-400 font-medium text-sm rounded-lg hover:bg-red-500/10">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-3 py-2 text-indigo-200 hover:text-white font-medium text-sm rounded-lg hover:bg-white/5">Login</Link>
                <Link to="/register" className="block px-3 py-2 text-indigo-200 hover:text-white font-medium text-sm rounded-lg hover:bg-white/5">Sign Up</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
