import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { pollAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { BarChart3, ExternalLink, Eye, EyeOff, Trash2, Copy, Plus, ArrowLeft } from 'lucide-react'

export default function MyPolls() {
  const [polls, setPolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all', 'active', 'inactive'
  const [confirmDelete, setConfirmDelete] = useState(null) // pollId awaiting confirmation
  const { token } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    loadPolls()
  }, [])

  const loadPolls = async () => {
    try {
      const res = await pollAPI.getMyPolls(token)
      if (res.polls) {
        setPolls(res.polls)
      }
    } catch {
      toast.error('Failed to load polls')
    }
    setLoading(false)
  }

  const togglePoll = async (pollId, currentStatus) => {
    const res = await pollAPI.toggle(pollId, !currentStatus, token)
    if (res.success) {
      setPolls(polls.map(p => p.pollId === pollId ? { ...p, isActive: res.isActive } : p))
      toast.success(res.isActive ? 'Poll activated' : 'Poll deactivated')
    } else {
      toast.error(res.error || 'Failed to update poll')
    }
  }

  const confirmAndDelete = async () => {
    const pollId = confirmDelete
    setConfirmDelete(null)
    const res = await pollAPI.delete(pollId, token)
    if (res.success) {
      setPolls(polls.filter(p => p.pollId !== pollId))
      toast.success('Poll deleted')
    } else {
      toast.error(res.error || 'Failed to delete poll')
    }
  }

  const copyLink = (pollId) => {
    const url = `${window.location.origin}/poll/${pollId}`
    navigator.clipboard.writeText(url)
    toast.success('Link copied!')
  }

  const filtered = polls.filter(p => {
    if (filter === 'active') return p.isActive
    if (filter === 'inactive') return !p.isActive
    return true
  })

  const activeCount = polls.filter(p => p.isActive).length
  const totalVotes = polls.reduce((s, p) => s + (p.totalVotes || 0), 0)

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1 text-indigo-300 hover:text-white text-sm mb-3 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">My Polls</h1>
            <p className="text-white/70">Manage and track your polls</p>
          </div>
          <Link
            to="/create"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Create New Poll
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-gray-800">{polls.length}</div>
            <div className="text-sm text-gray-600">Total Polls</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{totalVotes}</div>
            <div className="text-sm text-gray-600">Total Votes</div>
          </div>
        </div>

        {/* Filter Tabs */}
        {polls.length > 0 && (
          <div className="flex gap-2 mb-6">
            {[
              { key: 'all', label: 'All', count: polls.length },
              { key: 'active', label: 'Active', count: activeCount },
              { key: 'inactive', label: 'Closed', count: polls.length - activeCount },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-white text-indigo-600 shadow'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {tab.label} <span className="opacity-60">({tab.count})</span>
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : polls.length === 0 ? (
          <div className="glass rounded-2xl shadow-xl p-12 text-center">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">You haven't created any polls yet</p>
            <Link to="/create" className="text-indigo-600 hover:text-indigo-800 font-medium">
              Create your first poll →
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-gray-500 text-lg">No {filter} polls</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((poll) => (
              <div key={poll.pollId} className="glass rounded-xl p-6 shadow-lg">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-800">{poll.question}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        poll.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {poll.isActive ? 'Active' : 'Closed'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span><strong className="text-gray-700">{poll.totalVotes || 0}</strong> votes</span>
                      <span>&bull;</span>
                      <span>{poll.options.length} options</span>
                      {poll.createdAt && (
                        <>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(poll.createdAt).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => copyLink(poll.pollId)}
                      className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Copy share link"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                    <Link
                      to={`/poll/${poll.pollId}`}
                      className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="View Poll"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => togglePoll(poll.pollId, poll.isActive)}
                      className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title={poll.isActive ? 'Close poll' : 'Open poll'}
                    >
                      {poll.isActive ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(poll.pollId)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete poll"
                    >
                      <Trash2 className="w-5 h-5" />
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
                          <span>{percentage}% ({option.voteCount})</span>
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

      {/* Confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Delete Poll?</h3>
            </div>
            <p className="text-gray-600 mb-6">
              This action <strong>cannot be undone</strong>. All votes and results will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAndDelete}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Delete Poll
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
