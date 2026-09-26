import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { pollAPI } from '../services/api'
import Navbar from '../components/Navbar'
import {
  BarChart3, Plus, Vote, MousePointerClick, Activity, ArrowRight, Clock,
} from 'lucide-react'

export default function Dashboard() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [myPolls, setMyPolls] = useState([])
  const [votedPolls, setVotedPolls] = useState([])
  const [allPolls, setAllPolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('created')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [myRes, votedRes, allRes] = await Promise.all([
        pollAPI.getMyPolls(token),
        pollAPI.getMyVotes(token),
        pollAPI.getAll(),
      ])
      setMyPolls(myRes.polls || [])
      setVotedPolls(votedRes.polls || [])
      setAllPolls(allRes.polls || [])
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  // Global stats (from all polls, not just the creator's own)
  const globalTotalVotes = allPolls.reduce((sum, p) => sum + (p.totalVotes || 0), 0)
  const totalPollCount = allPolls.length
  const activePollCount = allPolls.filter(p => p.isActive).length
  const totalPollsCreated = myPolls.length

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const getLeadingOption = (poll) => {
    if (!poll.options || poll.options.length === 0) return null
    return poll.options.reduce((a, b) => (a.voteCount || 0) > (b.voteCount || 0) ? a : b)
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome header */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl font-bold text-white mb-1">
            Welcome back, {user?.name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-indigo-200/60">Here's what's happening with your polls</p>
        </div>

        {/* Stats cards — show global stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Polls', value: totalPollCount, icon: <BarChart3 className="w-5 h-5" />, color: 'from-blue-500 to-cyan-500' },
            { label: 'Active Polls', value: activePollCount, icon: <Activity className="w-5 h-5" />, color: 'from-green-500 to-emerald-500' },
            { label: 'Total Votes', value: globalTotalVotes, icon: <Vote className="w-5 h-5" />, color: 'from-purple-500 to-pink-500' },
            { label: 'You Created', value: totalPollsCreated, icon: <MousePointerClick className="w-5 h-5" />, color: 'from-orange-500 to-amber-500' },
          ].map((stat) => (
            <div key={stat.label} className="glass rounded-2xl p-5 animate-fade-in-up">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} text-white mb-3 shadow-lg`}>
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-indigo-200/50 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="flex gap-3 mb-8">
          <Link
            to="/create"
            className="btn-primary inline-flex items-center gap-2 text-white px-6 py-3 rounded-xl font-bold shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Create Poll
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white/5 p-1 rounded-xl w-fit">
          {[
            { key: 'created', label: 'My Polls', count: myPolls.length },
            { key: 'voted', label: 'Voted Polls', count: votedPolls.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'bg-white/20 text-white shadow-md'
                  : 'text-indigo-200/50 hover:text-indigo-200/80'
              }`}
            >
              {tab.label}
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-white/20' : 'bg-white/5'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Poll lists */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* My Polls */}
            {activeTab === 'created' && (
              myPolls.length === 0 ? (
                <EmptyState
                  icon={<BarChart3 className="w-12 h-12" />}
                  title="No polls yet"
                  description="Create your first poll and share it with your audience"
                  action={{ label: 'Create Poll', to: '/create' }}
                />
              ) : (
                myPolls.map((poll, i) => (
                  <PollCard key={poll.pollId} poll={poll} index={i} type="created" formatDate={formatDate} getLeadingOption={getLeadingOption} />
                ))
              )
            )}

            {/* Voted Polls */}
            {activeTab === 'voted' && (
              votedPolls.length === 0 ? (
                <EmptyState
                  icon={<Vote className="w-12 h-12" />}
                  title="No votes yet"
                  description="Vote on any poll you have the link for"
                  action={{ label: 'Create Poll', to: '/create' }}
                />
              ) : (
                votedPolls.map((poll, i) => (
                  <PollCard key={poll.pollId} poll={poll} index={i} type="voted" formatDate={formatDate} getLeadingOption={getLeadingOption} />
                ))
              )
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function PollCard({ poll, index, type, formatDate, getLeadingOption }) {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)
  const leading = getLeadingOption(poll)
  const total = poll.totalVotes || 0

  return (
    <div
      className="glass rounded-2xl p-5 hover:bg-white/10 transition-all cursor-pointer group animate-fade-in-up"
      style={{ animationDelay: `${index * 60}ms` }}
      onClick={() => navigate(`/poll/${poll.pollId}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {type === 'created' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">
                Created
              </span>
            )}
            {type === 'voted' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 font-medium">
                Voted
              </span>
            )}
            <span className="text-xs text-indigo-200/40 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(poll.createdAt)}
            </span>
          </div>

          <h3 className="text-white font-semibold text-base mb-3 group-hover:text-indigo-300 transition-colors truncate">
            {poll.question}
          </h3>

          {/* Mini bar chart */}
          {total > 0 && poll.options && (
            <div className="space-y-1.5">
              {poll.options.slice(0, 3).map((opt) => {
                const pct = total > 0 ? (opt.voteCount / total) * 100 : 0
                const isLeading = leading && opt.id === leading.id
                return (
                  <div key={opt.id} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className={`truncate ${isLeading ? 'text-white font-medium' : 'text-indigo-200/60'}`}>
                          {opt.text}
                        </span>
                        <span className={`${isLeading ? 'text-white font-medium' : 'text-indigo-200/40'}`}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isLeading ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-indigo-400/30'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
              {poll.options.length > 3 && (
                <span className="text-xs text-indigo-200/30">+{poll.options.length - 3} more</span>
              )}
            </div>
          )}

          {total === 0 && (
            <p className="text-xs text-indigo-200/30">No votes yet</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <div className="text-lg font-bold text-white">{total}</div>
            <div className="text-xs text-indigo-200/40">votes</div>
          </div>
          <ArrowRight className={`w-5 h-5 text-indigo-300/40 group-hover:text-indigo-300 group-hover:translate-x-1 transition-all ${hovered ? 'translate-x-1' : ''}`} />
        </div>
      </div>
    </div>
  )
}

function EmptyState({ icon, title, description, action }) {
  const navigate = useNavigate()
  return (
    <div className="glass rounded-2xl p-12 text-center">
      <div className="text-indigo-200/20 mb-4 flex justify-center">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      <p className="text-indigo-200/50 text-sm mb-6 max-w-sm mx-auto">{description}</p>
      <Link
        to={action.to}
        className="btn-primary inline-flex items-center gap-2 text-white px-6 py-3 rounded-xl font-bold"
      >
        {action.label}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
