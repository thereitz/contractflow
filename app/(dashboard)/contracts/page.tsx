'use client'

import { FormEvent, useEffect, useState } from 'react'
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
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  async function load(searchValue = search) {
    const query = searchValue ? `?search=${encodeURIComponent(searchValue)}` : ''
    const res = await fetch(`/api/contracts${query}`, { cache: 'no-store' })
    const json = await res.json()
    setContracts(json.data || [])
  }

  useEffect(() => { load() }, [])

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await load(search)
  }

  async function handleClearSearch() {
    setSearch('')
    await load('')
  }

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

      <form onSubmit={handleSearch} className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <input
            placeholder="Поиск по названию или контрагенту"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="bg-gray-800 text-white px-4 py-2 rounded text-sm"
          >
            Найти
          </button>
          <button
            type="button"
            onClick={handleClearSearch}
            className="border px-4 py-2 rounded text-sm"
          >
            Сбросить
          </button>
        </div>
      </form>

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

      {contracts.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-500">Договоров пока нет</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contracts.map(c => (
            <div key={c.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    <Link href={`/contracts/${c.id}`} className="text-primary-700 hover:underline">
                      {c.title}
                    </Link>
                  </h3>
                  <div className="text-sm text-gray-600 mt-1">{c.counterparty}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">{new Date(c.createdAt).toLocaleDateString('ru-RU')}</div>
                  <div className="mt-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                      c.status === 'SIGNED' ? 'bg-green-100 text-green-700' : c.status === 'ARCHIVED' ? 'bg-gray-100 text-gray-700' : 'bg-primary-50 text-primary-700'
                    }`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-700">Инициатор: {c.initiator.name}</div>
                <Link href={`/contracts/${c.id}`} className="btn">Открыть</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}