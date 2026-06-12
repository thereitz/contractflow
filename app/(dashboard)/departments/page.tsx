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

  async function load() {
    const res = await fetch('/api/departments')
    const json = await res.json()
    setDepartments(json.data)
  }

  useEffect(() => { load() }, [])

  async function handleCreate() {
    if (!name.trim()) return
    setLoading(true)
    await fetch('/api/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    setName('')
    await load()
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
        <button
          onClick={handleCreate}
          disabled={loading}
          className="btn"
        >
          Добавить
        </button>
      </div>

      {departments.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-500">Отделов нет</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map(d => (
            <div key={d.id} className="card flex items-center justify-between">
              <div>
                <div className="font-medium">{d.name}</div>
              </div>
              <div className="text-sm text-gray-500">{d._count.users}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}