import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SunIcon, MoonIcon } from 'lucide-react'
import { api } from '../lib/api.ts'
import { useTheme } from '../lib/theme.ts'

export default function Login() {
  const navigate = useNavigate()
  const { isDark, toggle } = useTheme()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token } = await api.login(username, password)
      localStorage.setItem('admin_token', token)
      navigate('/')
    } catch {
      setError('Invalid credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f0f0f0] dark:bg-black">
      <button
        onClick={toggle}
        className="fixed top-4 right-4 p-2 text-black/40 transition-colors hover:text-black dark:text-white/40 dark:hover:text-white"
        title="Toggle theme"
      >
        {isDark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
      </button>

      <form
        onSubmit={submit}
        className="w-full max-w-sm border-2 border-black p-8 dark:border-white"
      >
        <h1 className="mb-6 text-2xl font-black tracking-tighter text-black uppercase dark:text-white">
          Admin Login
        </h1>

        {error && (
          <p className="mb-4 border border-red-500 p-2 font-mono text-xs text-red-500 dark:border-red-400 dark:text-red-400">
            {error}
          </p>
        )}

        <label className="mb-4 block">
          <span className="mb-1 block font-mono text-[11px] tracking-widest text-black/50 uppercase dark:text-white/50">
            Username
          </span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
            className="w-full border-2 border-black/30 bg-white px-3 py-2 font-mono text-sm text-black transition-colors outline-none focus:border-black dark:border-white/30 dark:bg-black dark:text-white dark:focus:border-white"
          />
        </label>

        <label className="mb-6 block">
          <span className="mb-1 block font-mono text-[11px] tracking-widest text-black/50 uppercase dark:text-white/50">
            Password
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border-2 border-black/30 bg-white px-3 py-2 font-mono text-sm text-black transition-colors outline-none focus:border-black dark:border-white/30 dark:bg-black dark:text-white dark:focus:border-white"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black py-2.5 font-black tracking-tight text-white uppercase transition-colors hover:bg-black/80 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/80"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
