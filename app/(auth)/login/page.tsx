'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, password }),
    })

    const json = await res.json()
    if (!res.ok) {
      setError(json.error)
      setLoading(false)
      return
    }
    window.location.href = '/contracts'
  }

  const DEV_USERS = [
    { label: 'Супер Админ', email: 'super@contractflow.dev' },
    { label: 'Администратор', email: 'admin@contractflow.dev' },
    { label: 'Юрист Иванов', email: 'lawyer@contractflow.dev' },
    { label: 'Начальник Коммерческого', email: 'head@contractflow.dev' },
    { label: 'Сотрудник Коммерческого', email: 'staff@contractflow.dev' },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="card w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-6 text-center">ContractFlow</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn disabled:opacity-50"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="mt-6 border-t pt-4">
          <p className="text-xs text-gray-400 mb-2">Быстрый вход · пароль: <span className="font-mono">password123</span></p>
          <div className="space-y-1">
            {DEV_USERS.map(u => (
              <button
                key={u.email}
                type="button"
                onClick={() => { setEmail(u.email); setPassword('password123') }}
                className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-gray-100 flex items-center justify-between group"
              >
                <span className="text-gray-700">{u.label}</span>
                <span className="text-gray-400 text-xs group-hover:text-gray-600">{u.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}