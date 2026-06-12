'use client'

import { useEffect, useState } from 'react'

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'LAWYER', 'HEAD', 'EMPLOYEE']
const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Супер-админ',
  ADMIN: 'Администратор',
  LAWYER: 'Юрист',
  HEAD: 'Начальник отдела',
  EMPLOYEE: 'Сотрудник',
}

interface Department { id: string; name: string }
interface User {
  id: string; name: string; email: string; role: string
  department: Department | null
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [form, setForm] = useState({ name: '', email: '', role: 'EMPLOYEE', departmentId: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  async function load() {
    const [u, d] = await Promise.all([
      fetch('/api/users').then(r => r.json()),
      fetch('/api/departments').then(r => r.json()),
    ])
    setUsers(u.data)
    setDepartments(d.data)
  }

  useEffect(() => { load() }, [])

  async function handleCreate() {
    setLoading(true)
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setForm({ name: '', email: '', role: 'EMPLOYEE', departmentId: '', password: '' })
      setShowForm(false)
      await load()
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Пользователи</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn"
        >
          + Добавить
        </button>
      </div>

      {showForm && (
        <div className="card mb-6 grid grid-cols-2 gap-3">
          <input placeholder="Имя" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          <input placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          <input placeholder="Пароль" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
            {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <select value={form.departmentId} onChange={e => setForm({...form, departmentId: e.target.value})}>
            <option value="">Без отдела</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button onClick={handleCreate} disabled={loading} className="btn">Сохранить</button>
        </div>
      )}

      {users.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-500">Пользователей нет</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map(u => (
            <div key={u.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{u.name}</div>
                  <div className="text-sm text-gray-600">{u.email}</div>
                </div>
                <div className="text-sm text-gray-500">{u.department?.name || '—'}</div>
              </div>
              <div className="mt-3">
                <span className="badge">{ROLE_LABELS[u.role]}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}