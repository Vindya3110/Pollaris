import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import { BarChart3, Zap, Share2, ArrowRight, Settings, Shield, Users } from 'lucide-react'

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="hero-bg relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950"></div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-28 text-center">
          <div className="animate-fade-in-up">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
              <span className="gradient-text-white">Live Polls,</span>
              <br />
              <span className="gradient-text">Real-Time Results</span>
            </h1>
            <p className="text-lg md:text-xl text-indigo-200/80 mb-10 max-w-2xl mx-auto leading-relaxed">
              Create a poll in seconds, share the link, and watch results update live as your audience votes.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {user ? (
                <Link
                  to="/create"
                  className="btn-primary inline-flex items-center gap-2 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg"
                >
                  Create a Poll
                  <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="btn-primary inline-flex items-center gap-2 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
              )}
              <Link
                to="/my-polls"
                className="inline-flex items-center gap-2 bg-white/10 text-white border border-white/20 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all"
              >
                My Polls
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24" style={{ background: 'linear-gradient(180deg, #24243e 0%, #1a1a2e 100%)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-indigo-200/60 max-w-xl mx-auto text-lg">Three simple steps to engage your audience with live, real-time polling.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <BarChart3 className="w-8 h-8 text-white" />,
                step: '1',
                title: 'Create Your Poll',
                desc: 'Sign up, write a question, add options. Takes about 30 seconds.',
              },
              {
                icon: <Share2 className="w-8 h-8 text-white" />,
                step: '2',
                title: 'Share the Link',
                desc: 'Copy the unique link and share it anywhere — chat, email, social media.',
              },
              {
                icon: <Zap className="w-8 h-8 text-white" />,
                step: '3',
                title: 'Watch Results Live',
                desc: 'Results update in real-time as votes come in. No refresh needed.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center animate-fade-in-up">
                <div className="flex justify-center mb-6">
                  <div className="step-number w-16 h-16 rounded-2xl flex items-center justify-center">
                    {item.icon}
                  </div>
                </div>
                <div className="text-sm font-bold text-indigo-400 mb-2 tracking-wider">STEP {item.step}</div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-indigo-200/50 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24" style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Built for Live Engagement</h2>
            <p className="text-indigo-200/60 max-w-xl mx-auto text-lg">Everything you need for audience polling, powered by a robust real-time stack.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap className="w-6 h-6 text-indigo-400" />,
                title: 'Truly Real-Time',
                desc: 'WebSocket-powered live updates. Results animate instantly as votes arrive — no polling, no refresh.',
              },
              {
                icon: <Share2 className="w-6 h-6 text-indigo-400" />,
                title: 'Shareable Links',
                desc: 'Copy the unique poll link and share it anywhere — chat, email, social media. Anyone with the link can vote.',
              },
              {
                icon: <BarChart3 className="w-6 h-6 text-indigo-400" />,
                title: 'Live Bar Charts',
                desc: 'Animated bar charts show vote distribution in real-time. See the lead change as votes come in.',
              },
              {
                icon: <Settings className="w-6 h-6 text-indigo-400" />,
                title: 'Creator Dashboard',
                desc: 'Manage all your polls from one place. Activate, deactivate, or delete polls anytime.',
              },
              {
                icon: <Shield className="w-6 h-6 text-indigo-400" />,
                title: 'Google Sign-In',
                desc: 'Sign in with email or your Google account. Quick setup, no password to remember.',
              },
              {
                icon: <Users className="w-6 h-6 text-indigo-400" />,
                title: 'Multi-Account Voting',
                desc: 'Different accounts on the same device each get their own vote, so collaborators can vote independently.',
              },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className="glass-card rounded-2xl p-6 animate-fade-in-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="feature-icon w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-indigo-200/50 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="glass rounded-2xl p-8 md:p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { label: 'Tech Stack', value: '4', sub: 'React, Go, MongoDB, Redis' },
                { label: 'Real-Time', value: 'WebSocket', sub: 'Live vote streaming' },
                { label: 'Auth', value: 'JWT + OAuth', sub: 'Google + Email sign-in' },
                { label: 'Deploy', value: 'Docker', sub: 'One-command setup' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl md:text-3xl font-bold gradient-text mb-1">{stat.value}</div>
                  <div className="text-sm font-medium text-gray-300 mb-1">{stat.label}</div>
                  <div className="text-xs text-gray-500">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to go live?</h2>
          <p className="text-indigo-200/60 mb-10 text-lg">Create your first poll in under a minute.</p>
          {user ? (
            <Link
              to="/create"
              className="btn-primary inline-flex items-center gap-2 text-white px-10 py-4 rounded-xl font-bold text-lg shadow-lg"
            >
              Create a Poll
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <Link
              to="/register"
              className="btn-primary inline-flex items-center gap-2 text-white px-10 py-4 rounded-xl font-bold text-lg shadow-lg"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-indigo-300/40 text-sm">
            Pollaris — Live Polling Tool. Built with React, Go, MongoDB & Redis.
          </p>
        </div>
      </footer>
    </div>
  )
}
