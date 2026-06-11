# ContractFlow

Система согласования договоров и фиксации ответственности подразделений компании.

---

## Текущий стек

- Next.js 14 (App Router)
- TypeScript
- Prisma 5
- PostgreSQL
- Tailwind CSS / PostCSS
- JWT-аутентификация
- Zod, bcryptjs, jsonwebtoken, date-fns

---

## Локальный запуск

```bash
npm install
npm run dev
# http://localhost:3000
```

---

## Скрипты

```bash
npm run dev
npm run build
npm run start
npm run lint
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

Файлы `.env` и `.env.local` лежат в корне проекта и не публикуются в git.

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
JWT_SECRET="..."
```

---

## Структура проекта

```
app/
├── (auth)/login/          # страница логина
├── (dashboard)/           # защищённые страницы
│   ├── layout.tsx         # общий layout для авторизованной части
│   ├── contracts/         # список договоров
│   │   └── [id]/          # карточка договора
│   ├── departments/       # список отделов
│   └── users/             # список пользователей
└── api/
    ├── auth/login/
    ├── auth/logout/
    ├── auth/me/
    ├── contracts/
    │   ├── route.ts
    │   └── [id]/
    │       ├── route.ts
    │       ├── archive/
    │       ├── approvals/
    │       ├── comments/
    │       ├── departments/
    │       │   └── [deptId]/
    │       │       └── route.ts
    │       ├── send-collecting/
    │       └── send-approval/
    ├── departments/route.ts
    └── users/route.ts

components/
└── ArchiveButton.tsx       # кнопка архивирования договора

lib/
├── prisma.ts              # Prisma client singleton
└── auth.ts                # getCurrentUser(), createToken()

prisma/
├── schema.prisma          # схема БД
├── seed.ts                # тестовые данные
└── migrations/
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
- **ActivityLog** — история действий

---

## Что реализовано

- [x] Авторизация через JWT и httpOnly cookie
- [x] Роли пользователей и middleware защита роутов
- [x] CRUD пользователей (только SUPER_ADMIN)
- [x] CRUD отделов (только SUPER_ADMIN)
- [x] Создание договоров (LAWYER, SUPER_ADMIN)
- [x] Список договоров с фильтрацией по роли
- [x] Карточка договора с деталями, отделами, комментариями и историей
- [x] Назначение отделов к договору
- [x] Подтверждение сдачи информации отделом (HEAD)
- [x] Автоматический переход статуса COLLECTING → REVIEWING при сдаче отделов
- [x] Отправка на согласование (LAWYER)
- [x] Согласование / возврат на доработку (HEAD)
- [x] Автоматический переход в SIGNED при согласовании всеми начальниками
- [x] Журнал действий (ActivityLog) хранится и отображается в карточке договора
- [x] Архивация договора через API

---

## Что НЕ реализовано (следующие шаги)

- [ ] Файл `/logs` для общего журнала действий
- [ ] Страница профиля пользователя
- [ ] Уведомления
- [ ] Полноценный поиск по договорам
- [ ] Аналитический дашборд
- [ ] Возможный фикс Tailwind CSS, если стили не применяются

---

## Известные проблемы

- `tailwind.config.ts` и `postcss.config.mjs` есть, но стили могут не применяться без дополнительной настройки
- локальное выполнение может быть медленным при удалённой базе данных

---

## Git workflow

```bash
git add .
git commit -m "описание"
git push
```

### Откат изменений

```bash
git checkout .
git reset --hard HEAD
```

---

## Команды

```bash
npm run dev                          # локальный запуск
npm run build                        # сборка (prisma generate + next build)
npm run start                        # запуск собранного приложения
npm run lint                         # проверка ESLint
npx prisma migrate dev --name NAME   # новая миграция
npx prisma db seed                   # заполнить БД тестовыми данными
npx prisma studio                    # GUI для базы данных
```

---

## Важные замечания для разработчиков

- Всегда читать `SPEC.md` перед реализацией задачи
- Любое действие пользователя должно фиксироваться в `ActivityLog`
- Prisma client использовать только из `lib/prisma.ts`
- Входящие данные валидировать через Zod
- При создании файлов в папках с `[id]` использовать терминал, не GUI VSCode
