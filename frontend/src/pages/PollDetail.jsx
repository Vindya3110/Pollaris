import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { pollAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { BarChart3, Share2, Check, ArrowLeft } from 'lucide-react'

export default function PollDetail() {
  const { id } = useParams()
  const [poll, setPoll] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedOption, setSelectedOption] = useState(null)
  const [voting, setVoting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)
  const { token } = useAuth()
  const navigate = useNavigate()

  const loadPoll = useCallback(async () => {
    try {
      const res = await pollAPI.getOne(id)
      if (res.pollId) {
        setPoll(res)
      } else {
        toast.error('Poll not found')
        navigate('/')
      }
    } catch {
      toast.error('Failed to load poll')
    }
    setLoading(false)
  }, [id, navigate])

  useEffect(() => {
    loadPoll()
  }, [loadPoll])

  // WebSocket for live updates
  const handleWSMessage = useCallback((msg) => {
    if (msg.type === 'poll_update') {
      setWsConnected(true)
      const payload = msg.payload
      // Check if this is a deletion notice
      if (payload.type === 'poll_deleted' || msg.payload?.type === 'poll_deleted') {
        toast.error('This poll has been deleted by its creator')
        setTimeout(() => navigate('/'), 2000)
        return
      }
      setPoll((prev) => ({
        ...prev,
        totalVotes: payload.totalVotes,
        options: payload.options,
      }))
    } else if (msg.type === 'welcome') {
      setWsConnected(true)
    }
  }, [navigate])

  // Custom WebSocket hook inline
  useEffect(() => {
    if (!id) return
    const wsUrl = `ws://${window.location.host}/ws?pollId=${id}`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => setWsConnected(true)
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        handleWSMessage(msg)
      } catch (e) { console.error(e) }
    }
    ws.onerror = () => {}
    ws.onclose = () => setWsConnected(false)

    return () => ws.close()
  }, [id, handleWSMessage])

  const handleVote = async () => {
    if (!selectedOption) {
      toast.error('Please select an option')
      return
    }
    if (!token) {
      toast.error('Please login to vote')
      navigate('/login')
      return
    }

    setVoting(true)
    const res = await pollAPI.vote({ pollId: id, optionId: selectedOption }, token)

    if (res.success) {
      setHasVoted(true)
      setPoll((prev) => ({
        ...prev,
        totalVotes: res.totalVotes,
        options: res.options,
      }))
      toast.success('Vote recorded!')
    } else {
      toast.error(res.error || 'Failed to vote')
    }
    setVoting(false)
  }

  const sharePoll = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copied to clipboard!')
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    )
  }

  if (!poll) return null

  const total = poll.totalVotes || 0

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="glass rounded-2xl shadow-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/"
              className="flex items-center gap-1 text-gray-500 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-sm text-gray-500">{wsConnected ? 'Live' : 'Connecting...'}</span>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-2">{poll.question}</h1>
          <p className="text-gray-500 mb-8">{total} votes</p>

          {!hasVoted ? (
            <div className="space-y-3">
              {poll.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedOption(option.id)}
                  className={`poll-option w-full text-left px-6 py-4 rounded-xl border-2 transition-all ${
                    selectedOption === option.id
                      ? 'border-indigo-600 bg-indigo-50 selected'
                      : 'border-gray-200 hover:border-indigo-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedOption === option.id ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300'
                    }`}>
                      {selectedOption === option.id && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <span className="font-medium text-gray-800">{option.text}</span>
                  </div>
                </button>
              ))}

              <button
                onClick={handleVote}
                disabled={!selectedOption || voting}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 mt-4"
              >
                {voting ? 'Voting...' : !token ? 'Login to Vote' : 'Cast Vote'}
              </button>

              {!token && (
                <p className="text-center text-gray-500 text-sm">
                  <Link to="/login" className="text-indigo-600 hover:underline">Login</Link> or <Link to="/register" className="text-indigo-600 hover:underline">Sign up</Link> to vote
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {poll.options.map((option) => {
                const percentage = total > 0 ? Math.round((option.voteCount / total) * 100) : 0
                return (
                  <div key={option.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-800">{option.text}</span>
                      <span className="text-gray-500">{percentage}% ({option.voteCount})</span>
                    </div>
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full bar-animated transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={sharePoll}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <Share2 className="w-4 h-4" />
              Share Poll
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
