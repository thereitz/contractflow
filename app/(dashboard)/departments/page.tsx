'use client'

import { useEffect, useState } from 'react'

interface Department {
  id: string
  name: string
  _count: { users: number }
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const res = await fetch('/api/departments')
    const json = await res.json()
    setDepartments(json.data)
  }

  useEffect(() => { load() }, [])

  async function handleCreate() {
    if (!name.trim()) return
    setLoading(true)
    setError(null)
    const res = await fetch('/api/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    const json = await res.json()
    if (res.ok) {
      setName('')
      await load()
    } else {
      setError(json.error)
    }
    setLoading(false)
  }

  async function handleEdit() {
    if (!editName.trim() || !editId) return
    setLoading(true)
    setError(null)
    const res = await fetch(`/api/departments/${editId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName }),
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

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Отделы</h1>

      <div className="flex gap-2 mb-6">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Название отдела"
          className="w-64"
        />
        <button onClick={handleCreate} disabled={loading} className="btn">
          Добавить
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {departments.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-500">Отделов нет</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map(d => (
            <div key={d.id} className="card">
              {editId === d.id ? (
                <div className="flex flex-col gap-2">
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleEdit} disabled={loading} className="btn text-sm">Сохранить</button>
                    <button onClick={() => setEditId(null)} className="btn btn-secondary text-sm">Отмена</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{d.name}</div>
                    <div className="text-sm text-gray-500 mt-1">{d._count.users} сотр.</div>
                  </div>
                  <button
                    onClick={() => { setEditId(d.id); setEditName(d.name); setError(null) }}
                    className="btn btn-secondary text-xs px-2 py-1"
                  >
                    Изменить
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
