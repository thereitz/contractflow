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
      Уведомления
      {count > 0 && (
        <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-semibold text-white">
          {count}
        </span>
      )}
    </Link>
  )
}
