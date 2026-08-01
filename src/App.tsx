import { Routes, Route, Navigate } from 'react-router'
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
      <Route path="/" element={<Home />} />
      <Route path="/chat" element={<GeminiChat />} />
    </Routes>
  )
}
