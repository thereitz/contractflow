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
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
        >
          + Добавить
        </button>
      </div>

      {showForm && (
        <div className="border rounded p-4 mb-6 bg-gray-50 grid grid-cols-2 gap-3">
          <input placeholder="Имя" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            className="border rounded px-3 py-2 text-sm" />
          <input placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
            className="border rounded px-3 py-2 text-sm" />
          <input placeholder="Пароль" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
            className="border rounded px-3 py-2 text-sm" />
          <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
            className="border rounded px-3 py-2 text-sm">
            {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
          <select value={form.departmentId} onChange={e => setForm({...form, departmentId: e.target.value})}
            className="border rounded px-3 py-2 text-sm">
            <option value="">Без отдела</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button onClick={handleCreate} disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm">
            Сохранить
          </button>
        </div>
      )}

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 text-sm font-medium">Имя</th>
            <th className="text-left py-2 text-sm font-medium">Email</th>
            <th className="text-left py-2 text-sm font-medium">Роль</th>
            <th className="text-left py-2 text-sm font-medium">Отдел</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} className="border-b">
              <td className="py-2 text-sm">{u.name}</td>
              <td className="py-2 text-sm">{u.email}</td>
              <td className="py-2 text-sm">{ROLE_LABELS[u.role]}</td>
              <td className="py-2 text-sm">{u.department?.name || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}