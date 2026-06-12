import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const user = await getCurrentUser()
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="rounded-lg bg-white p-8 shadow">
          <h1 className="text-xl font-semibold mb-4">Аналитика</h1>
          <p className="text-sm text-red-600">Пользователь не авторизован.</p>
        </div>
      </div>
    )
  }

  const totalContracts = await prisma.contract.count()
  const activeContracts = await prisma.contract.count({
    where: { status: { not: 'ARCHIVED' } },
  })
  const signedContracts = await prisma.contract.count({
    where: { status: 'SIGNED' },
  })
  const archivedContracts = await prisma.contract.count({
    where: { status: 'ARCHIVED' },
  })

  const statusGroups = await prisma.contract.groupBy({
    by: ['status'],
    _count: { status: true },
  })

  const departmentGroups = await prisma.contractDepartment.groupBy({
    by: ['departmentId'],
    _count: { contractId: true },
    orderBy: { _count: { contractId: 'desc' } },
  })

  const departmentIds = departmentGroups.map(group => group.departmentId)
  const departments = await prisma.department.findMany({
    where: { id: { in: departmentIds } },
  })
  const departmentMap = new Map(departments.map(dept => [dept.id, dept.name]))

  const latestActivities = await prisma.activityLog.findMany({
    take: 7,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true } },
      contract: { select: { title: true } },
    },
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Аналитика</h1>
        <p className="text-sm text-gray-600">Основные показатели по договорам и отделам.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <div className="card">
          <p className="text-sm text-gray-500">Всего договоров</p>
          <p className="mt-3 text-3xl font-semibold text-gray-900">{totalContracts}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Активные</p>
          <p className="mt-3 text-3xl font-semibold text-gray-900">{activeContracts}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Подписано</p>
          <p className="mt-3 text-3xl font-semibold text-gray-900">{signedContracts}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Архив</p>
          <p className="mt-3 text-3xl font-semibold text-gray-900">{archivedContracts}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card">
          <h2 className="text-lg font-semibold mb-4">Договоры по статусам</h2>
          <div className="space-y-3">
            {statusGroups.map(group => (
              <div key={group.status} className="flex items-center justify-between border-b py-3 last:border-b-0">
                <span className="text-sm text-gray-700">{group.status}</span>
                <span className="text-sm font-semibold text-gray-900">{group._count.status}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h2 className="text-lg font-semibold mb-4">Договоры по отделам</h2>
          {departmentGroups.length === 0 ? (
            <p className="text-sm text-gray-600">Нет данных по отделам.</p>
          ) : (
            <div className="space-y-3">
              {departmentGroups.map(group => (
                <div key={group.departmentId} className="flex items-center justify-between border-b py-3 last:border-b-0">
                  <span className="text-sm text-gray-700">{departmentMap.get(group.departmentId) ?? 'Неизвестный отдел'}</span>
                  <span className="text-sm font-semibold text-gray-900">{group._count.contractId}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="card mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Последние события</h2>
            <p className="text-sm text-gray-500">События логов по последним изменениям в договорах.</p>
          </div>
        </div>
        <div className="space-y-3">
          {latestActivities.map(log => (
            <div key={log.id} className="rounded-lg border bg-gray-50 p-4">
              <div className="text-sm text-gray-500">{new Date(log.createdAt).toLocaleString('ru-RU')}</div>
              <div className="mt-1 text-sm text-gray-900">{log.action}</div>
              <div className="mt-1 text-sm text-gray-600">{log.user.name} {log.contract ? `— ${log.contract.title}` : ''}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
