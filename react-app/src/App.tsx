import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'

export default function App() {
  return (
    <Routes>
      {/* Home feed */}
      <Route path="/" element={<Home />} />

      {/* Catch-all — more routes added in Phase 3+ */}
      <Route
        path="*"
        element={
          <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
            <h2>Page not yet migrated</h2>
            <p>
              <a href="/">← Back to Home</a>
            </p>
          </div>
        }
      />
    </Routes>
  )
}
