'use client'

import { useEffect, useState } from 'react'

interface NotificationItem {
  id: string
  title: string
  message: string | null
  link: string | null
  read: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function loadNotifications() {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' })
      const json = await res.json()
      if (res.ok) {
        setNotifications(json.data ?? [])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  async function markAllRead() {
    setSaving(true)
    try {
      await fetch('/api/notifications', { method: 'PATCH' })
      await loadNotifications()
    } finally {
      setSaving(false)
    }
  }

  async function markRead(id: string) {
    setSaving(true)
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      })
      await loadNotifications()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Уведомления</h1>
          <p className="text-sm text-gray-600">Последние уведомления по вашей активности.</p>
        </div>
        <button
          onClick={markAllRead}
          disabled={saving}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Отметить все как прочитанные
        </button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="rounded-lg border bg-white p-6 text-sm text-gray-600">Загрузка...</div>
        ) : notifications.length === 0 ? (
          <div className="rounded-lg border bg-white p-6 text-sm text-gray-600">У вас пока нет уведомлений.</div>
        ) : (
          <div className="space-y-3">
            {notifications.map(item => (
              <div
                key={item.id}
                className={`rounded-lg border p-4 shadow-sm ${item.read ? 'bg-gray-50' : 'bg-white'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">{item.title}</h2>
                    <p className="mt-1 text-sm text-gray-600">{item.message || 'Нет описания'}</p>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <div>{new Date(item.createdAt).toLocaleString('ru-RU')}</div>
                    {!item.read && <span className="mt-1 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">Новое</span>}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {item.link ? (
                    <a href={item.link} className="text-sm text-blue-600 hover:underline">Перейти</a>
                  ) : null}
                  {!item.read && (
                    <button
                      onClick={() => markRead(item.id)}
                      disabled={saving}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      Пометить как прочитанное
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
