'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function NotificationBell() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let mounted = true
    fetch('/api/notifications?countOnly=1', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (mounted && data?.data?.count >= 0) {
          setCount(data.data.count)
        }
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])

  return (
    <Link href="/notifications" className="relative text-sm text-gray-600 hover:text-gray-900">
      <span className="inline-flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2a4 4 0 00-4 4v2.586l-.707.707A1 1 0 005 11h10a1 1 0 00.707-1.707L15 8.586V6a4 4 0 00-4-4z" />
          <path d="M9 16a2 2 0 104 0H9z" />
        </svg>
        <span>Уведомления</span>
      </span>
      {count > 0 && (
        <span className="absolute -right-2 -top-2 badge">
          {count}
        </span>
      )}
    </Link>
  )
}
