import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { pollAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { BarChart3, ExternalLink, Eye, EyeOff } from 'lucide-react'

export default function MyPolls() {
  const [polls, setPolls] = useState([])
  const [loading, setLoading] = useState(true)
  const { token } = useAuth()

  useEffect(() => {
    loadPolls()
  }, [])

  const loadPolls = async () => {
    try {
      const res = await pollAPI.getMy(token)
      if (res.polls) {
        setPolls(res.polls)
      }
    } catch {
      toast.error('Failed to load polls')
    }
    setLoading(false)
  }

  const togglePoll = async (pollId, currentStatus) => {
    try {
      const res = await pollAPI.toggle(pollId, !currentStatus, token)
      if (res.success) {
        setPolls(polls.map(p => p.pollId === pollId ? { ...p, isActive: res.isActive } : p))
        toast.success(res.isActive ? 'Poll activated' : 'Poll deactivated')
      }
    } catch {
      toast.error('Failed to update poll')
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">My Polls</h1>
            <p className="text-white/70">Manage and track your polls</p>
          </div>
          <Link
            to="/create"
            className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg"
          >
            Create New Poll
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : polls.length === 0 ? (
          <div className="glass rounded-2xl shadow-xl p-12 text-center">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">You haven't created any polls yet</p>
            <Link to="/create" className="text-indigo-600 hover:text-indigo-800 font-medium">
              Create your first poll
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {polls.map((poll) => (
              <div key={poll.pollId} className="glass rounded-xl p-6 shadow-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">{poll.question}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{poll.totalVotes || 0} votes</span>
                      <span>&bull;</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        poll.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {poll.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/poll/${poll.pollId}`}
                      className="p-2 text-gray-500 hover:text-indigo-600 transition-colors"
                      title="View Poll"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => togglePoll(poll.pollId, poll.isActive)}
                      className={`p-2 transition-colors ${
                        poll.isActive ? 'text-gray-500 hover:text-orange-600' : 'text-gray-500 hover:text-green-600'
                      }`}
                      title={poll.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {poll.isActive ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Mini bar chart */}
                <div className="mt-4 space-y-2">
                  {poll.options.map((option) => {
                    const percentage = (poll.totalVotes || 0) > 0 ? Math.round((option.voteCount / poll.totalVotes) * 100) : 0
                    return (
                      <div key={option.id} className="space-y-1">
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>{option.text}</span>
                          <span>{percentage}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
