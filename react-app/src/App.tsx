import { Routes, Route } from 'react-router-dom'
import { useAuth } from './store/auth'

function Home() {
  const { user, status } = useAuth()

  const statusColor: Record<string, string> = {
    loading: '#f59e0b',
    authenticated: '#10b981',
    unauthenticated: '#6b7280',
    unavailable: '#ef4444',
  }

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: '600px' }}>
      <h1>Conduit (React)</h1>
      <p>
        <strong>Auth status: </strong>
        <span style={{ color: statusColor[status] ?? '#000', fontWeight: 'bold' }}>
          {status}
        </span>
      </p>
      {user && (
        <p>
          Logged in as <strong>{user.username}</strong> ({user.email})
        </p>
      )}
      <hr />
      <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
        Phase 2 complete — AuthProvider, useAuth, auth API functions ready.
        <br />
        Phase 3 next: Header, Footer, ListErrors layout components.
      </p>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="*" element={<Home />} />
    </Routes>
  )
}
