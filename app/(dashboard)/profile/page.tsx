'use client'

import { useEffect, useState } from 'react'

interface ProfileUser {
  id: string
  name: string
  email: string
  role: string
  department: { name: string } | null
  createdAt: string
  updatedAt: string
}

export default function ProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function loadUser() {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' })
      const json = await res.json()
      if (res.ok) {
        setUser(json.data)
        setName(json.data.name)
        setEmail(json.data.email)
      } else {
        setStatus(json.error || 'Не удалось загрузить профиль')
      }
    } catch {
      setStatus('Ошибка загрузки профиля')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUser()
  }, [])

  async function handleSave() {
    setSaving(true)
    setStatus('')

    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const json = await res.json()
      if (!res.ok) {
        setStatus(json.error || 'Не удалось сохранить профиль')
      } else {
        setStatus('Профиль обновлён')
        setPassword('')
        setUser(json.data)
      }
    } catch {
      setStatus('Ошибка при сохранении профиля')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-600">Загрузка профиля...</div>
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Профиль пользователя</h1>
        <p className="text-sm text-gray-600">Вы можете обновить имя, email и пароль.</p>
      </div>

      {status && (
        <div className="mb-4 rounded border bg-gray-50 px-4 py-3 text-sm text-gray-700">{status}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="card">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Имя</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Новый пароль</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="mt-1 w-full rounded border px-3 py-2 text-sm"
                placeholder="Оставьте пустым, если не меняете"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn"
            >
              Сохранить
            </button>
          </div>
        </div>
        <div className="card">
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <div className="font-medium text-gray-500">Роль</div>
              <div className="mt-1 text-gray-900">{user?.role}</div>
            </div>
            <div>
              <div className="font-medium text-gray-500">Отдел</div>
              <div className="mt-1 text-gray-900">{user?.department?.name ?? 'Не назначен'}</div>
            </div>
            <div>
              <div className="font-medium text-gray-500">Создан</div>
              <div className="mt-1 text-gray-900">{new Date(user?.createdAt).toLocaleString('ru-RU')}</div>
            </div>
            <div>
              <div className="font-medium text-gray-500">Обновлён</div>
              <div className="mt-1 text-gray-900">{new Date(user?.updatedAt).toLocaleString('ru-RU')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
