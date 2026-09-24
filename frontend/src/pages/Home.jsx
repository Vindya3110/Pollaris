import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import { BarChart3, Zap, Users, Share2, ArrowRight, Globe, Clock, QrCode, TrendingUp, EyeOff, Settings } from 'lucide-react'

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-300 rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Live Polls,<br />
            <span className="text-indigo-200">Real-Time Results</span>
          </h1>
          <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Create a poll in seconds, share the link, and watch results update live as your audience votes. No page refresh needed.
          </p>
          <div className="flex items-center justify-center gap-4">
            {user ? (
              <Link
                to="/create"
                className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                Create a Poll
                <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <Link
                to="/register"
                className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            )}
            <Link
              to="/my-polls"
              className="inline-flex items-center gap-2 bg-indigo-500/30 text-white border border-indigo-300 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-indigo-500/40 transition-colors"
            >
              My Polls
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">How It Works</h2>
          <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">Three simple steps to engage your audience with live, real-time polling.</p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <BarChart3 className="w-10 h-10 text-indigo-600" />,
                step: '1',
                title: 'Create Your Poll',
                desc: 'Sign up, write a question, add options. Takes about 30 seconds.',
              },
              {
                icon: <Share2 className="w-10 h-10 text-purple-600" />,
                step: '2',
                title: 'Share the Link',
                desc: 'Copy the unique link and share it anywhere — chat, email, social media.',
              },
              {
                icon: <Zap className="w-10 h-10 text-green-600" />,
                step: '3',
                title: 'Watch Results Live',
                desc: 'Results update in real-time as votes come in. No refresh needed.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 mb-4 group-hover:bg-indigo-100 transition-colors">
                  {item.icon}
                </div>
                <div className="text-sm font-bold text-indigo-600 mb-2">STEP {item.step}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">Built for Speed and Scale</h2>
          <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">Everything you need for live audience engagement, powered by a robust real-time stack.</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap className="w-6 h-6" />,
                title: 'Truly Real-Time',
                desc: 'WebSocket-powered live updates. Results animate instantly as votes arrive — no polling, no refresh.',
              },
              {
                icon: <Clock className="w-6 h-6" />,
                title: 'Poll Expiration',
                desc: 'Set an optional deadline for your poll. After expiry, voting closes automatically and the final results are locked.',
              },
              {
                icon: <QrCode className="w-6 h-6" />,
                title: 'QR Code Sharing',
                desc: 'Generate a QR code for any poll and print it on posters, slides, or handouts. Great for in-person events and classrooms.',
              },
              {
                icon: <TrendingUp className="w-6 h-6" />,
                title: 'Live Vote Timeline',
                desc: 'Watch votes arrive in real-time with an animated timeline. See momentum shifts and trending spikes as your audience responds.',
              },
              {
                icon: <EyeOff className="w-6 h-6" />,
                title: 'Anonymous Results',
                desc: 'Hide individual vote counts until the poll closes or the creator reveals them. Prevent bandwagon effects during live voting.',
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: 'Live Bar Charts',
                desc: 'Animated bar charts show vote distribution in real-time. See the lead change as votes come in.',
              },
              {
                icon: <Settings className="w-6 h-6" />,
                title: 'Creator Dashboard',
                desc: 'Manage all your polls from one place. Activate, deactivate, or delete polls anytime.',
              },
            ].map((feature) => (
              <div key={feature.title} className="glass rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="text-indigo-600 mb-3">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to go live?</h2>
          <p className="text-indigo-200 mb-8 text-lg">Create your first poll in under a minute.</p>
          {user ? (
            <Link
              to="/create"
              className="inline-flex items-center gap-2 bg-white text-indigo-600 px-10 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Create a Poll
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white text-indigo-600 px-10 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm">
          <p>Pollaris — Live Polling Tool. Built with React, Go, MongoDB & Redis.</p>
        </div>
      </footer>
    </div>
  )
}
