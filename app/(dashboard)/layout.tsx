'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import NotificationBell from '@/components/NotificationBell'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  function navLink(href: string) {
    const base = 'text-sm px-3 py-1 rounded-md'
    if (pathname === href) return base + ' bg-primary-50 text-primary-700'
    return base + ' text-gray-600 hover:text-gray-900 hover:bg-gray-50'
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b shadow-sm">
        <div className="container-max px-6 py-3 flex items-center gap-4">
          <span className="font-semibold text-gray-900 mr-2">ContractFlow</span>
          <Link href="/contracts" className={navLink('/contracts')}>
            Договоры
          </Link>
          <Link href="/users" className={navLink('/users')}>
            Пользователи
          </Link>
          <Link href="/departments" className={navLink('/departments')}>
            Отделы
          </Link>
          <Link href="/analytics" className={navLink('/analytics')}>
            Аналитика
          </Link>
          <Link href="/profile" className={navLink('/profile')}>
            Профиль
          </Link>
          <NotificationBell />
          <Link href="/logs" className={navLink('/logs')}>
            Журнал
          </Link>
          <div className="ml-auto">
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Выйти
            </button>
          </div>
        </div>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  )
}