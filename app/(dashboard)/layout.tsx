'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-3 flex items-center gap-6">
        <span className="font-semibold text-gray-900">ContractFlow</span>
        <Link href="/contracts" className="text-sm text-gray-600 hover:text-gray-900">
          Договоры
        </Link>
        <Link href="/users" className="text-sm text-gray-600 hover:text-gray-900">
          Пользователи
        </Link>
        <Link href="/departments" className="text-sm text-gray-600 hover:text-gray-900">
          Отделы
        </Link>
        <Link href="/logs" className="text-sm text-gray-600 hover:text-gray-900">
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
      </nav>
      <main className="p-6">{children}</main>
    </div>
  )
}