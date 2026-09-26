import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { pollAPI, WS_URL } from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import { BarChart3, Share2, Check, ArrowLeft, CheckCircle2, Radio } from 'lucide-react'

export default function PollDetail() {
  const { id } = useParams()
  const [poll, setPoll] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedOption, setSelectedOption] = useState(null)
  const [voting, setVoting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const { token } = useAuth()
  const navigate = useNavigate()

  const loadPoll = useCallback(async () => {
    try {
      const res = await pollAPI.getOne(id)
      if (res.pollId) {
        setPoll(res)
        // Only show results if THIS viewer has voted
        const voted = !!res.userVoted
        setHasVoted(voted)
        setShowResults(voted)
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

  const handleWSMessage = useCallback((msg) => {
    if (msg.type === 'poll_update') {
      setWsConnected(true)
      const payload = msg.payload
      if (payload.type === 'poll_deleted') {
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

  useEffect(() => {
    if (!id) return
    const wsUrl = `${WS_URL}?pollId=${id}`
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
      setShowResults(true)
      // Reload poll to get full results now that we're marked as voted
      await loadPoll()
      toast.success('Vote recorded! Here are the live results.')
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
          <div className="spinner"></div>
        </div>
      </div>
    )
  }

  if (!poll) return null

  const total = poll.totalVotes || 0
  const maxVotes = Math.max(...poll.options.map(o => o.voteCount || 0), 1)

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="glass rounded-2xl shadow-2xl p-8 md:p-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-indigo-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-400 live-dot' : 'bg-gray-500'}`}></div>
              <span className="text-sm text-gray-400">{wsConnected ? 'Live' : 'Connecting...'}</span>
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">{poll.question}</h1>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400 ml-[52px]">
              <span className="flex items-center gap-1">
                <Radio className="w-3.5 h-3.5" />
                {total} {total === 1 ? 'vote' : 'votes'}
              </span>
              {hasVoted && (
                <span className="flex items-center gap-1 text-green-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  You voted
                </span>
              )}
            </div>
          </div>

          {/* Voting / Results */}
          {!hasVoted ? (
            <div className="space-y-3 mb-8">
              {poll.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedOption(option.id)}
                  disabled={!poll.isActive}
                  className={`poll-option w-full text-left px-6 py-4 rounded-xl border-2 ${
                    selectedOption === option.id
                      ? 'border-indigo-500 selected'
                      : 'border-white/10 bg-white/5'
                  } ${!poll.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-3 relative z-10">
                    <div className={`option-check w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedOption === option.id
                        ? 'border-indigo-500 bg-indigo-500'
                        : 'border-gray-500'
                    }`}>
                      {selectedOption === option.id && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span className={`font-medium ${selectedOption === option.id ? 'text-white' : 'text-gray-200'}`}>
                      {option.text}
                    </span>
                  </div>
                </button>
              ))}

              {!poll.isActive && (
                <p className="text-center text-amber-400 text-sm py-2">This poll is closed</p>
              )}

              <p className="text-center text-gray-500 text-xs py-1">
                🔒 Results hidden until you vote
              </p>

              <button
                onClick={handleVote}
                disabled={!selectedOption || voting || !poll.isActive}
                className="btn-primary w-full text-white py-4 rounded-xl font-bold text-lg mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {voting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Voting...
                  </span>
                ) : !token ? 'Login to Vote' : 'Cast Vote'}
              </button>

              {!token && (
                <p className="text-center text-gray-400 text-sm">
                  <Link to="/login" className="text-indigo-400 hover:text-indigo-300">Login</Link>
                  {' or '}
                  <Link to="/register" className="text-indigo-400 hover:text-indigo-300">Sign up</Link>
                  {' to vote'}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4 mb-8">
              {poll.options.map((option, i) => {
                const percentage = total > 0 ? Math.round((option.voteCount / total) * 100) : 0
                const isWinner = option.voteCount === maxVotes && option.voteCount > 0
                return (
                  <div key={option.id} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className={`font-medium ${isWinner ? 'text-white' : 'text-gray-300'}`}>
                        {option.text}
                        {isWinner && ' 👑'}
                      </span>
                      <span className="text-gray-400">{percentage}% ({option.voteCount})</span>
                    </div>
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="vote-bar bar-fill-animated h-full rounded-full"
                        style={{
                          width: `${percentage}%`,
                          background: isWinner
                            ? 'linear-gradient(90deg, #6366f1, #a855f7)'
                            : 'linear-gradient(90deg, rgba(99,102,241,0.5), rgba(139,92,246,0.5))',
                        }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Share */}
          <div className="pt-6 border-t border-white/10">
            <button
              onClick={sharePoll}
              className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Copy Poll Link
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
