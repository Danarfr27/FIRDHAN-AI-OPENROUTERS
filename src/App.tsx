import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LoginPage } from '@/pages/Login'
import Home from '@/pages/Home'
import { GeminiChat } from '@/components/GeminiChat'

export default function App() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />}
      />
      <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/login" replace />} />
      <Route path="/chat" element={isAuthenticated ? <GeminiChat /> : <Navigate to="/login" replace />} />
    </Routes>
  )
}
// GitHub reconnection trigger at Sun, Aug  2, 2026  1:44:22 AM
