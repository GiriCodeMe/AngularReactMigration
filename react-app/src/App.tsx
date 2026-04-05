import { Routes, Route } from 'react-router-dom'

// Placeholder — pages will be added in Phase 3+
function Home() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>Conduit (React)</h1>
      <p>Phase 1 complete — API client and types ready.</p>
      <p>
        API base: <code>https://api.realworld.show/api</code>
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
