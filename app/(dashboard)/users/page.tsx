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

const emptyForm = { name: '', email: '', role: 'EMPLOYEE', departmentId: '', password: '' }

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const [u, d] = await Promise.all([
      fetch('/api/users').then(r => r.json()),
      fetch('/api/departments').then(r => r.json()),
    ])
    setUsers(u.data ?? [])
    setDepartments(d.data ?? [])
  }

  useEffect(() => { load() }, [])

  async function handleCreate() {
    setLoading(true)
    setError(null)
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    if (res.ok) {
      setForm(emptyForm)
      setShowForm(false)
      await load()
    } else {
      setError(json.error)
    }
    setLoading(false)
  }

  async function handleEdit() {
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/users/${editId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    const json = await res.json()
    if (res.ok) {
      setEditId(null)
      await load()
    } else {
      setError(json.error)
    }
    setLoading(false)
  }

  function startEdit(u: User) {
    setEditId(u.id)
    setEditForm({ name: u.name, email: u.email, role: u.role, departmentId: u.department?.id || '', password: '' })
    setError(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Пользователи</h1>
        <button onClick={() => { setShowForm(!showForm); setError(null) }} className="btn">
          + Добавить
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

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
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={loading} className="btn">Сохранить</button>
            <button onClick={() => setShowForm(false)} className="btn btn-secondary">Отмена</button>
          </div>
        </div>
      )}

      {users.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-500">Пользователей нет</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {users.map(u => (
            <div key={u.id} className="card">
              {editId === u.id ? (
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Имя" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="col-span-2" />
                  <input placeholder="Email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="col-span-2" />
                  <input placeholder="Новый пароль (необязательно)" type="password" value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} className="col-span-2" />
                  <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})}>
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                  <select value={editForm.departmentId} onChange={e => setEditForm({...editForm, departmentId: e.target.value})}>
                    <option value="">Без отдела</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <div className="col-span-2 flex gap-2 mt-1">
                    <button onClick={handleEdit} disabled={loading} className="btn text-sm">Сохранить</button>
                    <button onClick={() => setEditId(null)} className="btn btn-secondary text-sm">Отмена</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{u.name}</div>
                      <div className="text-sm text-gray-600">{u.email}</div>
                    </div>
                    <div className="text-sm text-gray-500">{u.department?.name || '—'}</div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="badge">{ROLE_LABELS[u.role]}</span>
                    <button onClick={() => startEdit(u)} className="btn btn-secondary text-xs px-2 py-1">
                      Изменить
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
