import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { pollAPI } from '../services/api'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import ProtectedRoute from '../components/ProtectedRoute'
import { Plus, X, BarChart3, ArrowRight } from 'lucide-react'

function CreatePollForm() {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [loading, setLoading] = useState(false)
  const { token } = useAuth()
  const navigate = useNavigate()

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, ''])
    }
  }

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const updateOption = (index, value) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const filteredOptions = options.filter(o => o.trim() !== '')
    if (filteredOptions.length < 2) {
      toast.error('At least 2 options required')
      return
    }

    if (question.trim().length < 3) {
      toast.error('Question must be at least 3 characters')
      return
    }

    setLoading(true)
    try {
      const res = await pollAPI.create({ question, options: filteredOptions }, token)

      if (res.id) {
        toast.success('Poll created!')
        navigate(`/poll/${res.id}`)
      } else {
        const errMsg = res.error || 'Failed to create poll'
        toast.error(errMsg)
        console.error('Create poll failed:', res)
      }
    } catch (err) {
      toast.error('Network error. Please try again.')
      console.error('Create poll error:', err)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="glass rounded-3xl shadow-2xl p-8 md:p-10 animate-fade-in-up">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Create a Poll</h2>
              </div>
            </div>
            <p className="text-gray-400 ml-[52px]">Ask a question and give people options to vote on</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-indigo-200 mb-2">Your Question</label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="input-field w-full px-4 py-3.5 rounded-xl text-gray-800"
                placeholder="What do you want to ask?"
                required
                minLength={3}
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-indigo-200 mb-3">Options</label>
              <div className="space-y-3">
                {options.map((opt, i) => (
                  <div key={i} className="flex gap-3 animate-fade-in">
                    <span className="flex items-center justify-center w-10 h-12 rounded-xl gradient-primary text-white font-bold text-sm shadow-md">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      className="input-field flex-1 px-4 py-3 rounded-xl text-gray-800"
                      placeholder={`Option ${i + 1}`}
                      maxLength={100}
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(i)}
                        className="px-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < 10 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="mt-3 inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add another option
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-white py-4 rounded-xl font-bold text-base disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating Poll...
                </>
              ) : (
                <>
                  Create Poll
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function CreatePoll() {
  return (
    <ProtectedRoute>
      <CreatePollForm />
    </ProtectedRoute>
  )
}
