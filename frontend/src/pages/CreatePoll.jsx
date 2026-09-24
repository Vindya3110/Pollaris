import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { pollAPI } from '../services/api'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar'
import ProtectedRoute from '../components/ProtectedRoute'

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

    setLoading(true)
    const res = await pollAPI.create({ question, options: filteredOptions }, token)

    if (res.id) {
      toast.success('Poll created!')
      navigate(`/poll/${res.id}`)
    } else {
      toast.error(res.error || 'Failed to create poll')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="glass rounded-2xl shadow-2xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Create a Poll</h2>
          <p className="text-gray-600 mb-8">Ask a question and give people options to vote on</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Question</label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="What do you want to ask?"
                required
                minLength={3}
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <span className="flex items-center justify-center w-8 h-12 bg-indigo-100 text-indigo-600 rounded-lg font-bold">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder={`Option ${i + 1}`}
                    maxLength={100}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="px-3 text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {options.length < 10 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="text-indigo-600 hover:text-indigo-800 font-medium text-sm mt-2"
                >
                  + Add another option
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating Poll...' : 'Create Poll'}
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
