import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { pollAPI } from '../services/api'
import Navbar from '../components/Navbar'
import { BarChart3, Users, Vote, Clock, Search, ArrowRight, Filter } from 'lucide-react'

export default function BrowsePolls() {
  const [polls, setPolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadPolls()
  }, [])

  const loadPolls = async () => {
    setLoading(true)
    try {
      const res = await pollAPI.getAll()
      setPolls(res.polls || [])
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const filtered = polls.filter(p =>
    p.question.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Browse Polls</h1>
              <p className="text-indigo-200/60 text-sm">Vote on active polls and see live results</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search polls..."
            className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500/50"
          />
        </div>

        {/* Poll list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-indigo-200/20 mb-4 flex justify-center">
              <BarChart3 className="w-16 h-16" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {polls.length === 0 ? 'No polls yet' : 'No matches'}
            </h3>
            <p className="text-indigo-200/50 max-w-sm mx-auto">
              {polls.length === 0
                ? 'Be the first to create a poll and share it with others.'
                : 'Try a different search term.'}
            </p>
            {polls.length === 0 && (
              <Link
                to="/create"
                className="btn-primary inline-flex items-center gap-2 text-white px-6 py-3 rounded-xl font-bold mt-6"
              >
                Create a Poll <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((poll, i) => {
              const total = poll.totalVotes || 0
              const leading = poll.options?.reduce((a, b) =>
                (a.voteCount || 0) > (b.voteCount || 0) ? a : b, { voteCount: 0 }
              )

              return (
                <Link
                  key={poll.pollId}
                  to={`/poll/${poll.pollId}`}
                  className="glass rounded-2xl p-5 hover:bg-white/10 transition-all block animate-fade-in-up"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          poll.isActive
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {poll.isActive ? 'Active' : 'Closed'}
                        </span>
                        <span className="text-xs text-indigo-200/40 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(poll.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-white font-semibold text-base mb-3 group-hover:text-indigo-300 transition-colors">
                        {poll.question}
                      </h3>

                      {/* Mini results preview */}
                      {total > 0 && poll.options && (
                        <div className="space-y-1.5">
                          {poll.options.slice(0, 3).map((opt) => {
                            const pct = total > 0 ? Math.round((opt.voteCount / total) * 100) : 0
                            const isLeading = leading && opt.id === leading.id && opt.voteCount > 0
                            return (
                              <div key={opt.id} className="flex items-center gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between text-xs mb-0.5">
                                    <span className={`truncate ${isLeading ? 'text-white font-medium' : 'text-indigo-200/60'}`}>
                                      {opt.text}
                                    </span>
                                    <span className={`${isLeading ? 'text-white' : 'text-indigo-200/40'}`}>
                                      {pct}%
                                    </span>
                                  </div>
                                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${isLeading ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-indigo-400/30'}`}
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
                        <p className="text-xs text-indigo-200/30">No votes yet — be the first!</p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">{total}</div>
                        <div className="text-xs text-indigo-200/40">votes</div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-indigo-300/40" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
