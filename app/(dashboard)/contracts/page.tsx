'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Черновик',
  COLLECTING: 'Сбор информации',
  REVIEWING: 'На рассмотрении',
  APPROVAL: 'На согласовании',
  SIGNED: 'Подписан',
  ARCHIVED: 'Архив',
}

interface Contract {
  id: string
  title: string
  counterparty: string
  status: string
  createdAt: string
  initiator: { name: string }
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', counterparty: '', object: '', amount: '' })
  const [loading, setLoading] = useState(false)

  async function load() {
    const res = await fetch('/api/contracts')
    const json = await res.json()
    setContracts(json.data || [])
  }

  useEffect(() => { load() }, [])

  async function handleCreate() {
    if (!form.title || !form.counterparty) return
    setLoading(true)
    const res = await fetch('/api/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setForm({ title: '', counterparty: '', object: '', amount: '' })
      setShowForm(false)
      await load()
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Договоры</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
        >
          + Новый договор
        </button>
      </div>

      {showForm && (
        <div className="border rounded p-4 mb-6 bg-gray-50 grid grid-cols-2 gap-3">
          <input
            placeholder="Название договора *"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className="border rounded px-3 py-2 text-sm col-span-2"
          />
          <input
            placeholder="Контрагент *"
            value={form.counterparty}
            onChange={e => setForm({ ...form, counterparty: e.target.value })}
            className="border rounded px-3 py-2 text-sm"
          />
          <input
            placeholder="Сумма"
            value={form.amount}
            onChange={e => setForm({ ...form, amount: e.target.value })}
            className="border rounded px-3 py-2 text-sm"
          />
          <input
            placeholder="Предмет договора"
            value={form.object}
            onChange={e => setForm({ ...form, object: e.target.value })}
            className="border rounded px-3 py-2 text-sm col-span-2"
          />
          <div className="col-span-2 flex gap-2">
            <button
              onClick={handleCreate}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
            >
              Создать
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="border px-4 py-2 rounded text-sm"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 text-sm font-medium">Название</th>
            <th className="text-left py-2 text-sm font-medium">Контрагент</th>
            <th className="text-left py-2 text-sm font-medium">Статус</th>
            <th className="text-left py-2 text-sm font-medium">Инициатор</th>
            <th className="text-left py-2 text-sm font-medium">Дата</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map(c => (
            <tr key={c.id} className="border-b hover:bg-gray-50">
              <td className="py-2 text-sm">
                <Link href={`/contracts/${c.id}`} className="text-blue-600 hover:underline">
                  {c.title}
                </Link>
              </td>
              <td className="py-2 text-sm">{c.counterparty}</td>
              <td className="py-2 text-sm">{STATUS_LABELS[c.status]}</td>
              <td className="py-2 text-sm">{c.initiator.name}</td>
              <td className="py-2 text-sm">{new Date(c.createdAt).toLocaleDateString('ru-RU')}</td>
            </tr>
          ))}
          {contracts.length === 0 && (
            <tr>
              <td colSpan={5} className="py-8 text-center text-sm text-gray-500">
                Договоров пока нет
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}