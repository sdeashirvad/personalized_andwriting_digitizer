import { Routes, Route } from 'react-router-dom'
import { Header } from './components/Header'
import { Home } from './pages/Home'
import { useEffect } from 'react'

export default function App() {
  useEffect(() => {
    const theme = localStorage.getItem('acd_theme')
    if (theme === 'light') {
      document.documentElement.classList.remove('dark')
      document.documentElement.style.backgroundColor = '#ffffff'
      document.body.style.backgroundColor = '#ffffff'
    } else {
      document.documentElement.classList.add('dark')
      document.documentElement.style.backgroundColor = '#09090b'
      document.body.style.backgroundColor = '#09090b'
    }
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col w-full transition-colors duration-200">
      <Header />
      <main className="flex-1 w-full">
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </main>
    </div>
  )
}
