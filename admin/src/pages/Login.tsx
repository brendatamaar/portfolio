import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api.ts'

export default function Login() {
  const navigate = useNavigate()
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
    <div className="min-h-screen flex items-center justify-center bg-black">
      <form
        onSubmit={submit}
        className="w-full max-w-sm border-2 border-white p-8"
      >
        <h1 className="font-black text-2xl uppercase tracking-tighter text-white mb-6">
          Admin Login
        </h1>

        {error && (
          <p className="mb-4 font-mono text-xs text-red-400 border border-red-400 p-2">
            {error}
          </p>
        )}

        <label className="block mb-4">
          <span className="font-mono text-[11px] uppercase tracking-widest text-white/50 mb-1 block">
            Username
          </span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
            className="w-full bg-black border-2 border-white/30 focus:border-white text-white px-3 py-2 font-mono text-sm outline-none transition-colors"
          />
        </label>

        <label className="block mb-6">
          <span className="font-mono text-[11px] uppercase tracking-widest text-white/50 mb-1 block">
            Password
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-black border-2 border-white/30 focus:border-white text-white px-3 py-2 font-mono text-sm outline-none transition-colors"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-white text-black font-black uppercase tracking-tight py-2.5 hover:bg-white/80 transition-colors disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
