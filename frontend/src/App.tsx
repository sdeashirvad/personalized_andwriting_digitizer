import { Routes, Route } from 'react-router-dom'
import { Header } from './components/Header'
import { Home } from './pages/Home'
import { useEffect } from 'react'

export default function App() {
  useEffect(() => {
    const theme = localStorage.getItem('acd_theme')
    if (theme !== 'light') {
      document.documentElement.classList.add('dark')
    }
  }, [])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#09090b', color: '#f4f4f5', display: 'flex', flexDirection: 'column', width: '100%' }}>
      <Header />
      <main style={{ flex: 1, width: '100%' }}>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </main>
    </div>
  )
}
