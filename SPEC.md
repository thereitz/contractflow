# ContractFlow — SPEC.md

> Этот файл является главным техническим документом проекта.
> Claude Code читает его перед каждой задачей.
> Стек: Next.js 14 (App Router) · Prisma · Supabase (PostgreSQL + Auth + Storage) · Vercel

---

## 1. Стек и структура проекта

```
contractflow/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Страницы авторизации (login)
│   ├── (dashboard)/            # Защищённые страницы
│   │   ├── contracts/          # Список и карточки договоров
│   │   ├── departments/        # Управление отделами
│   │   ├── users/              # Управление пользователями
│   │   └── logs/               # Журнал действий
│   └── api/                    # API Routes
│       ├── contracts/
│       ├── departments/
│       ├── users/
│       └── logs/
├── components/                 # UI-компоненты
├── lib/
│   ├── prisma.ts               # Prisma client (singleton)
│   ├── supabase.ts             # Supabase client
│   └── auth.ts                 # Хелперы авторизации
├── prisma/
│   ├── schema.prisma           # Схема БД
│   └── migrations/             # Миграции (git-версионируются)
├── middleware.ts               # Защита роутов по ролям
├── SPEC.md                     # Этот файл
└── CLAUDE.md                   # Правила для Claude Code
```

### Зависимости

```json
{
  "dependencies": {
    "next": "14",
    "@prisma/client": "latest",
    "@supabase/supabase-js": "latest",
    "@supabase/auth-helpers-nextjs": "latest",
    "zod": "latest",
    "date-fns": "latest"
  },
  "devDependencies": {
    "prisma": "latest",
    "typescript": "latest",
    "@types/node": "latest"
  }
}
```

---

## 2. Переменные окружения (.env.local)

```env
DATABASE_URL="postgresql://..."           # Supabase → Settings → Database → Connection string
DIRECT_URL="postgresql://..."             # Supabase → прямое подключение (для миграций Prisma)
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."           # Только на сервере, никогда на клиенте
NEXTAUTH_SECRET="..."                     # Случайная строка 32+ символа
```

---

## 3. Схема базы данных (Prisma)

### 3.1 Роли и перечисления

```prisma
enum Role {
  SUPER_ADMIN
  ADMIN
  LAWYER
  HEAD        // Начальник отдела
  EMPLOYEE    // Сотрудник отдела
}

enum ContractStatus {
  DRAFT               // Черновик
  COLLECTING          // Сбор информации от отделов
  REVIEWING           // Юрист формирует финальную версию
  APPROVAL            // На согласовании у начальников
  SIGNED              // Подписан
  ARCHIVED            // В архиве
}

enum DepartmentTaskStatus {
  PENDING             // Ожидает ответа
  IN_PROGRESS         // В работе
  SUBMITTED           // Информация предоставлена
}

enum ApprovalAction {
  APPROVED            // Согласовано
  RETURNED            // Возвращено на доработку
}
```

### 3.2 Таблицы

```prisma
model Department {
  id          String   @id @default(cuid())
  name        String   @unique
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  users                User[]
  contractDepartments  ContractDepartment[]
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String
  role         Role
  departmentId String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  department   Department?          @relation(fields: [departmentId], references: [id])
  comments     Comment[]
  approvals    Approval[]
  activityLogs ActivityLog[]
  contracts    Contract[]           @relation("ContractInitiator")
}

model Contract {
  id           String         @id @default(cuid())
  title        String
  counterparty String
  object       String?
  amount       Decimal?
  status       ContractStatus @default(DRAFT)
  initiatorId  String
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  initiator            User                 @relation("ContractInitiator", fields: [initiatorId], references: [id])
  files                ContractFile[]
  contractDepartments  ContractDepartment[]
  comments             Comment[]
  approvals            Approval[]
  activityLogs         ActivityLog[]
}

model ContractFile {
  id          String   @id @default(cuid())
  contractId  String
  version     Int
  filename    String
  storagePath String
  uploadedBy  String
  createdAt   DateTime @default(now())

  contract    Contract @relation(fields: [contractId], references: [id])

  @@unique([contractId, version])
}

model ContractDepartment {
  id           String               @id @default(cuid())
  contractId   String
  departmentId String
  status       DepartmentTaskStatus @default(PENDING)
  createdAt    DateTime             @default(now())
  updatedAt    DateTime             @updatedAt

  contract     Contract   @relation(fields: [contractId], references: [id])
  department   Department @relation(fields: [departmentId], references: [id])

  @@unique([contractId, departmentId])
}

model Comment {
  id         String   @id @default(cuid())
  contractId String
  authorId   String
  text       String
  createdAt  DateTime @default(now())

  contract   Contract @relation(fields: [contractId], references: [id])
  author     User     @relation(fields: [authorId], references: [id])
}

model Approval {
  id          String         @id @default(cuid())
  contractId  String
  userId      String
  action      ApprovalAction
  fileVersion Int
  comment     String?
  createdAt   DateTime       @default(now())

  contract    Contract @relation(fields: [contractId], references: [id])
  user        User     @relation(fields: [userId], references: [id])
}

model ActivityLog {
  id         String   @id @default(cuid())
  contractId String?
  userId     String
  action     String
  metadata   Json?
  createdAt  DateTime @default(now())

  contract   Contract? @relation(fields: [contractId], references: [id])
  user       User      @relation(fields: [userId], references: [id])
}
```

---

## 4. Бизнес-правила (важно для Claude Code)

### 4.1 Доступ по ролям

| Действие | SUPER_ADMIN | ADMIN | LAWYER | HEAD | EMPLOYEE |
|---|---|---|---|---|---|
| Создать пользователя | + | - | - | - | - |
| Создать отдел | + | - | - | - | - |
| Создать договор | + | - | + | - | - |
| Назначить отделы к договору | + | - | + | - | - |
| Оставить комментарий | + | - | + | + | + |
| Подтвердить информацию отдела | + | - | - | + | - |
| Согласовать / вернуть договор | + | - | - | + | - |
| Просмотр всех договоров | + | + | + | - | - |
| Просмотр договоров своего отдела | + | + | + | + | + |
| Просмотр журнала действий | + | + | - | - | - |

### 4.2 Переходы статусов договора

```
DRAFT       → COLLECTING   Юрист назначил отделы и запустил сбор информации
COLLECTING  → REVIEWING    Все ContractDepartment перешли в SUBMITTED
REVIEWING   → APPROVAL     Юрист загрузил финальную версию и отправил на согласование
APPROVAL    → COLLECTING   Хотя бы один HEAD вернул договор на доработку
APPROVAL    → SIGNED       Все HEAD назначенных отделов поставили APPROVED для текущей версии
SIGNED      → ARCHIVED     Юрист или ADMIN переводит в архив вручную
```

Переход APPROVAL → SIGNED происходит АВТОМАТИЧЕСКИ при последнем APPROVED.
Условие проверки:
- Все ContractDepartment.status == SUBMITTED
- Для каждого departmentId: существует Approval { action: APPROVED, fileVersion: currentVersion }
  от пользователя с ролью HEAD из этого отдела

### 4.3 Обязательные события в ActivityLog

```
contract.created           metadata: { title, counterparty }
contract.status_changed    metadata: { from: ContractStatus, to: ContractStatus }
contract.file_uploaded     metadata: { version: Int, filename: String }
department.assigned        metadata: { departmentId, departmentName }
department.status_changed  metadata: { departmentId, from: DepartmentTaskStatus, to: DepartmentTaskStatus }
comment.added              metadata: { commentId }
approval.approved          metadata: { fileVersion: Int, departmentId }
approval.returned          metadata: { fileVersion: Int, departmentId, comment: String }
```

### 4.4 Файлы в Supabase Storage

- Бакет: contract-files (приватный)
- Путь: contracts/{contractId}/v{version}_{originalFilename}
- Версии нумеруются с 1, строго инкрементально
- Старые версии НИКОГДА не удаляются
- Скачивание — только через Signed URL (TTL 3600 секунд), генерируется на сервере
- При согласовании в Approval.fileVersion фиксируется номер файла, который согласовывали

---

## 5. API эндпоинты

### Авторизация
```
POST  /api/auth/login          body: { email, password }
POST  /api/auth/logout
GET   /api/auth/me             → { user: User }
```

### Пользователи (SUPER_ADMIN)
```
GET   /api/users               → { data: User[] }
POST  /api/users               body: { email, name, role, departmentId? }
PATCH /api/users/[id]          body: { role?, departmentId?, name? }
```

### Отделы (SUPER_ADMIN)
```
GET   /api/departments         → { data: Department[] }
POST  /api/departments         body: { name }
PATCH /api/departments/[id]    body: { name }
```

### Договоры
```
GET   /api/contracts                              query: { status?, departmentId? }
POST  /api/contracts                              body: { title, counterparty, object?, amount? }
GET   /api/contracts/[id]                         → полная карточка со всеми связями
PATCH /api/contracts/[id]                         body: { title?, counterparty?, object?, amount? }
POST  /api/contracts/[id]/files                   multipart: { file }
POST  /api/contracts/[id]/send-collecting         — запустить сбор информации
POST  /api/contracts/[id]/send-approval           — отправить на согласование
POST  /api/contracts/[id]/archive                 — перевести в архив
POST  /api/contracts/[id]/departments             body: { departmentIds: string[] }
PATCH /api/contracts/[id]/departments/[deptId]    body: { status: DepartmentTaskStatus }
POST  /api/contracts/[id]/comments                body: { text }
POST  /api/contracts/[id]/approvals               body: { action: ApprovalAction, comment? }
```

### Журнал
```
GET   /api/logs                query: { contractId?, userId?, limit?, offset? }
```

### Формат ответов
```typescript
// Успех
{ data: T }

// Ошибка
{ error: string }

// HTTP статусы: 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found
```

---

## 6. Middleware

```typescript
// middleware.ts
// 1. Нет сессии → редирект на /login
// 2. Есть сессия → пропустить, роль проверяется внутри каждого API Route

// Защищённые пути только для конкретных ролей:
const RESTRICTED: Record<string, Role[]> = {
  '/users':       ['SUPER_ADMIN'],
  '/departments': ['SUPER_ADMIN'],
  '/logs':        ['SUPER_ADMIN', 'ADMIN'],
}
// Все остальные /dashboard/* — любой авторизованный
```

---

## 7. Seed-данные для разработки (prisma/seed.ts)

```
super@contractflow.dev   пароль: password123   роль: SUPER_ADMIN
admin@contractflow.dev   пароль: password123   роль: ADMIN
lawyer@contractflow.dev  пароль: password123   роль: LAWYER
head@contractflow.dev    пароль: password123   роль: HEAD       отдел: Коммерческий
staff@contractflow.dev   пароль: password123   роль: EMPLOYEE   отдел: Коммерческий

Отделы: Коммерческий, Логистика, Финансовый, Технический, Юридический
```

---

## 8. CLAUDE.md

```markdown
# ContractFlow — правила для Claude Code

## Перед каждой задачей
1. Прочитай SPEC.md
2. Уточни, какие файлы будут изменены
3. Не удаляй существующую логику — добавляй рядом

## Обязательные правила
- Каждое действие пользователя → запись в ActivityLog (см. SPEC.md раздел 4.3)
- Все API-роуты проверяют роль пользователя в начале хендлера
- Prisma client — только через lib/prisma.ts (singleton)
- SUPABASE_SERVICE_ROLE_KEY — только на сервере, никогда в клиентском коде
- Все входящие данные валидируются через Zod перед обработкой
- TypeScript strict: true — не использовать any

## Формат API ответов
- Успех: { data: T } с нужным HTTP статусом
- Ошибка: { error: string } с нужным HTTP статусом

## Git
- Не делать коммиты самостоятельно
- Перед крупным изменением — предупредить, какие файлы затронет
```

---

## 9. Порядок реализации

```
Фаза 1   prisma/schema.prisma → npx prisma migrate dev → prisma/seed.ts
Фаза 2   Supabase Auth + lib/supabase.ts + lib/prisma.ts + middleware.ts
Фаза 3   /api/users + /api/departments + страницы управления (SUPER_ADMIN)
Фаза 4   /api/contracts (создание, список) + страница списка договоров
Фаза 5   Карточка договора + загрузка файлов в Supabase Storage
Фаза 6   Назначение отделов + комментарии + смена статуса задачи отдела
Фаза 7   Согласование (APPROVED/RETURNED) + автосмена статуса договора
Фаза 8   ActivityLog — хук на все события
Фаза 9   Страница журнала действий (ADMIN)
Фаза 10  Архив + финальный тест полного жизненного цикла договора
```
