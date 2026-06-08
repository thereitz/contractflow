process.env.DATABASE_URL = process.env.DIRECT_URL
import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('password123', 10)

  // Отделы
  const departments = await Promise.all([
    prisma.department.upsert({ where: { name: 'Коммерческий' }, update: {}, create: { name: 'Коммерческий' } }),
    prisma.department.upsert({ where: { name: 'Логистика' }, update: {}, create: { name: 'Логистика' } }),
    prisma.department.upsert({ where: { name: 'Финансовый' }, update: {}, create: { name: 'Финансовый' } }),
    prisma.department.upsert({ where: { name: 'Технический' }, update: {}, create: { name: 'Технический' } }),
    prisma.department.upsert({ where: { name: 'Юридический' }, update: {}, create: { name: 'Юридический' } }),
  ])

  // Пользователи
  await prisma.user.upsert({
    where: { email: 'super@contractflow.dev' },
    update: {},
    create: { email: 'super@contractflow.dev', name: 'Супер Админ', passwordHash: password, role: Role.SUPER_ADMIN },
  })
  await prisma.user.upsert({
    where: { email: 'admin@contractflow.dev' },
    update: {},
    create: { email: 'admin@contractflow.dev', name: 'Администратор', passwordHash: password, role: Role.ADMIN },
  })
  await prisma.user.upsert({
    where: { email: 'lawyer@contractflow.dev' },
    update: {},
    create: { email: 'lawyer@contractflow.dev', name: 'Юрист Иванов', passwordHash: password, role: Role.LAWYER },
  })
  await prisma.user.upsert({
    where: { email: 'head@contractflow.dev' },
    update: {},
    create: { email: 'head@contractflow.dev', name: 'Начальник Коммерческого', passwordHash: password, role: Role.HEAD, departmentId: departments[0].id },
  })
  await prisma.user.upsert({
    where: { email: 'staff@contractflow.dev' },
    update: {},
    create: { email: 'staff@contractflow.dev', name: 'Сотрудник Коммерческого', passwordHash: password, role: Role.EMPLOYEE, departmentId: departments[0].id },
  })

  console.log('Seed выполнен успешно')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())