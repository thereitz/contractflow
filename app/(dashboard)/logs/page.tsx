import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function LogsPage() {
  const user = await getCurrentUser()
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="rounded-lg bg-white p-8 shadow">
          <h1 className="text-xl font-semibold mb-4">Журнал действий</h1>
          <p className="text-sm text-red-600">Пользователь не авторизован.</p>
        </div>
      </div>
    )
  }

  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: { select: { name: true } },
      contract: { select: { title: true } },
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Журнал действий</h1>
          <p className="text-sm text-gray-600">Последние 100 записей активности по системе.</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Дата</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Пользователь</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Действие</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Договор</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Детали</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                  {format(new Date(log.createdAt), 'dd.MM.yyyy HH:mm', { locale: ru })}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{log.user.name}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{log.action}</td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {log.contract?.title ?? '—'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 break-words max-w-xl">
                  {log.metadata ? JSON.stringify(log.metadata) : '—'}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                  Записей нет.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
