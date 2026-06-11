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
          className="border rounded px-3 py-2 text-sm w-64"
        />
        <button
          onClick={handleCreate}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
        >
          Добавить
        </button>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 text-sm font-medium">Название</th>
            <th className="text-left py-2 text-sm font-medium">Сотрудников</th>
          </tr>
        </thead>
        <tbody>
          {departments.map(d => (
            <tr key={d.id} className="border-b">
              <td className="py-2 text-sm">{d.name}</td>
              <td className="py-2 text-sm">{d._count.users}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}