import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { AuthProvider } from '@/contexts/AuthContext'
import { ModelProvider } from '@/contexts/ModelContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <ModelProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ModelProvider>
  </AuthProvider>,
)
