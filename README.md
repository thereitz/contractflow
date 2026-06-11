# ContractFlow

Система согласования договоров и фиксации ответственности подразделений компании.

---

## Стек

- **Next.js 14** (App Router) — фронтенд + API Routes
- **Prisma 5** — ORM, схема БД, миграции
- **Supabase** — PostgreSQL + Storage (файлы договоров)
- **Vercel** — деплой (автодеплой при push в main)
- **GitHub** — репозиторий: `github.com/thereitz/contractflow`

---

## Локальный запуск

```bash
npm install
npm run dev
# http://localhost:3000
```

---

## Тестовые пользователи (seed)

| Email | Пароль | Роль | Отдел |
|---|---|---|---|
| super@contractflow.dev | password123 | SUPER_ADMIN | — |
| admin@contractflow.dev | password123 | ADMIN | — |
| lawyer@contractflow.dev | password123 | LAWYER | — |
| head@contractflow.dev | password123 | HEAD | Коммерческий |
| staff@contractflow.dev | password123 | EMPLOYEE | Коммерческий |

---

## Переменные окружения

Файлы `.env` и `.env.local` в корне проекта (не в git).

```env
DATABASE_URL="postgresql://postgres.rioptvockqhhfjyfzoky:...@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.rioptvockqhhfjyfzoky:...@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://rioptvockqhhfjyfzoky.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_..."
SUPABASE_SERVICE_ROLE_KEY="sb_secret_..."
JWT_SECRET="..."
```

---

## Структура проекта

```
app/
├── (auth)/login/          # Страница логина
├── (dashboard)/           # Защищённые страницы
│   ├── layout.tsx         # Навигация + кнопка выйти
│   ├── contracts/         # Список договоров
│   │   └── [id]/          # Карточка договора
│   ├── departments/       # Отделы
│   ├── users/             # Пользователи
│   └── logs/              # Журнал (не реализован)
└── api/
    ├── auth/login|logout|me
    ├── contracts/
    │   └── [id]/
    │       ├── comments/
    │       ├── departments/
    │       │   └── [deptId]/
    │       ├── approvals/
    │       ├── send-collecting/
    │       └── send-approval/
    ├── departments/
    └── users/

lib/
├── prisma.ts              # Prisma client singleton
└── auth.ts                # getCurrentUser(), createToken()

prisma/
├── schema.prisma          # Схема БД
├── seed.ts                # Тестовые данные
└── migrations/            # Миграции
```

---

## Схема БД (кратко)

- **User** — пользователи с ролями (SUPER_ADMIN, ADMIN, LAWYER, HEAD, EMPLOYEE)
- **Department** — отделы компании
- **Contract** — договоры со статусами (DRAFT → COLLECTING → REVIEWING → APPROVAL → SIGNED → ARCHIVED)
- **ContractFile** — версии файлов договора
- **ContractDepartment** — назначение отделов к договору (статусы: PENDING, IN_PROGRESS, SUBMITTED)
- **Comment** — комментарии к договору
- **Approval** — согласования/возвраты от начальников отделов
- **ActivityLog** — неизменяемый журнал всех действий

---

## Что реализовано (MVP)

- [x] Авторизация (JWT в httpOnly cookie)
- [x] Роли пользователей и middleware защита роутов
- [x] CRUD пользователей (только SUPER_ADMIN)
- [x] CRUD отделов (только SUPER_ADMIN)
- [x] Создание договоров (LAWYER, SUPER_ADMIN)
- [x] Список договоров с фильтрацией по роли
- [x] Карточка договора
- [x] Назначение отделов к договору
- [x] Подтверждение сдачи информации отделом (HEAD)
- [x] Автоматический переход статуса COLLECTING → REVIEWING когда все отделы сдали
- [x] Отправка на согласование (LAWYER)
- [x] Согласование / возврат на доработку (HEAD)
- [x] Автоматический переход в SIGNED когда все HEAD согласовали
- [x] Комментарии к договору
- [x] Журнал действий (ActivityLog) — пишется автоматически
- [x] Деплой на Vercel: contractflow-rho.vercel.app

---

## Что НЕ реализовано (следующие шаги)

- [ ] Загрузка файлов договора в Supabase Storage
- [ ] Страница журнала действий (/logs)
- [ ] Архив договоров
- [ ] Страница профиля пользователя
- [ ] Уведомления
- [ ] Tailwind CSS стили (подключён, но не применяется — нужно починить)
- [ ] Поиск по договорам
- [ ] Дашборд с аналитикой

---

## Известные проблемы

### Tailwind не применяется
Файлы `tailwind.config.ts` и `postcss.config.mjs` в корне проекта, `globals.css` создан, импорт в `app/layout.tsx` есть — но стили не применяются. Требует отладки.

### Медленные запросы локально
Supabase в регионе Singapore (ap-southeast-1). На проде (Vercel) будет быстрее.

---

## Git workflow

```bash
# Перед каждой новой задачей — коммит
git add .
git commit -m "описание"
git push
# Vercel автоматически деплоит при push в main
```

### Откат изменений
```bash
git checkout .        # отменить несохранённые изменения
git reset --hard HEAD # вернуться к последнему коммиту
```

---

## Команды

```bash
npm run dev                          # локальный запуск
npm run build                        # сборка (prisma generate + next build)
npx prisma migrate dev --name NAME   # новая миграция
npx prisma db seed                   # заполнить БД тестовыми данными
npx prisma studio                    # GUI для базы данных
```

---

## Важные замечания для Claude Code

- Всегда читать `SPEC.md` перед реализацией задачи
- Каждое действие пользователя → запись в `ActivityLog`
- Все API routes начинаются с `export const dynamic = 'force-dynamic'`
- `SUPABASE_SERVICE_ROLE_KEY` только на сервере
- Prisma client — только через `lib/prisma.ts`
- Входящие данные валидировать через Zod
- При создании файлов в папках с `[id]` — использовать терминал, не GUI VSCode (Windows не поддерживает квадратные скобки в именах через интерфейс)
