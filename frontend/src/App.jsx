import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import CreatePoll from './pages/CreatePoll'
import PollDetail from './pages/PollDetail'
import MyPolls from './pages/MyPolls'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/poll/:id" element={<PollDetail />} />
      <Route path="/polls" element={<Home />} />
      <Route
        path="/create"
        element={
          <ProtectedRoute>
            <CreatePoll />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-polls"
        element={
          <ProtectedRoute>
            <MyPolls />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
