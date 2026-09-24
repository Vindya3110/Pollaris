import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { pollAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { BarChart3, Users, Clock } from 'lucide-react'

export default function Home() {
  const [polls, setPolls] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    loadPolls()
  }, [])

  const loadPolls = async () => {
    try {
      const res = await pollAPI.getAll()
      if (res.polls) {
        setPolls(res.polls)
      }
    } catch {
      toast.error('Failed to load polls')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
            Live Polling, Instantly
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Create a poll, share the link, and watch results update in real-time as votes come in.
          </p>
          {user ? (
            <Link
              to="/create"
              className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Create Your First Poll
            </Link>
          ) : (
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Get Started
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="glass rounded-xl p-6 text-center">
            <BarChart3 className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-800">{polls.length}</div>
            <div className="text-gray-600">Active Polls</div>
          </div>
          <div className="glass rounded-xl p-6 text-center">
            <Users className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-800">
              {polls.reduce((sum, p) => sum + (p.totalVotes || 0), 0)}
            </div>
            <div className="text-gray-600">Total Votes</div>
          </div>
          <div className="glass rounded-xl p-6 text-center">
            <Clock className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <div className="text-3xl font-bold text-gray-800">24/7</div>
            <div className="text-gray-600">Live Updates</div>
          </div>
        </div>

        {/* Polls List */}
        <div className="glass rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Active Polls</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : polls.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No polls yet. Be the first to create one!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {polls.map((poll) => (
                <Link
                  key={poll.pollId}
                  to={`/poll/${poll.pollId}`}
                  className="block bg-white rounded-xl p-6 shadow hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{poll.question}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{poll.totalVotes || 0} votes</span>
                    <span>&bull;</span>
                    <span>{poll.options.length} options</span>
                  </div>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {poll.options.slice(0, 3).map((opt) => (
                      <span
                        key={opt.id}
                        className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm"
                      >
                        {opt.text}
                      </span>
                    ))}
                    {poll.options.length > 3 && (
                      <span className="text-gray-400 text-sm">+{poll.options.length - 3} more</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
