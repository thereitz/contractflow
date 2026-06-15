'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Черновик',
  REQUESTED: 'Запрошен юристом',
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
  initiator: { id: string; name: string; role: string }
}

interface User {
  id: string
  role: string
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', counterparty: '', object: '', amount: '' })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'REQUESTED'>('ALL')
  const [loading, setLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const isLawyer = currentUser?.role === 'LAWYER' || currentUser?.role === 'SUPER_ADMIN'

  const isRequestedContract = (contract: Contract) =>
    contract.status === 'DRAFT' && contract.title.startsWith('Запрос:')

  async function load(searchValue = search) {
    const query = searchValue ? `?search=${encodeURIComponent(searchValue)}` : ''
    const [contractsRes, userRes] = await Promise.all([
      fetch(`/api/contracts${query}`, { cache: 'no-store' }),
      fetch('/api/auth/me', { cache: 'no-store' }),
    ])

    const [contractsJson, userJson] = await Promise.all([
      contractsRes.json(),
      userRes.json(),
    ])

    setContracts(contractsJson.data || [])
    if (userRes.ok) setCurrentUser(userJson.data)
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

  const filteredContracts = contracts.filter(contract => {
    if (statusFilter === 'REQUESTED') {
      return isRequestedContract(contract)
    }
    return true
  })

  async function handleCreate() {
    if (!form.counterparty) return
    if (isLawyer && !form.title) return
    setLoading(true)
    const res = await fetch('/api/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setForm({ title: '', counterparty: '', object: '', amount: '' })
      setShowForm(false)
      if (!isLawyer) {
        setShowSuccessModal(true)
      } else {
        await load()
      }
    }
    setLoading(false)
  }

  return (
    <div>
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full mx-4 text-center">
            <div className="mb-4 flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Успешно отправлено</h2>
            <p className="text-sm text-gray-500 mb-6">Договор передан юристу на рассмотрение.</p>
            <button
              onClick={async () => {
                setShowSuccessModal(false)
                await load()
              }}
              className="btn w-full"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Договоры</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn"
        >
          + Новый договор
        </button>
      </div>

      <form onSubmit={handleSearch} className="mb-6 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-gray-600">Фильтр:</span>
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`rounded-full px-3 py-1 text-sm ${statusFilter === 'ALL' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Все
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('REQUESTED')}
              className={`rounded-full px-3 py-1 text-sm ${statusFilter === 'REQUESTED' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700'}`}
            >
              Запросы юристу
            </button>
          </div>
        </div>
      </form>

      {showForm && (
        <div className="card mb-6 grid grid-cols-2 gap-3">
          {isLawyer && (
            <input
              placeholder="Название договора *"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="col-span-2"
            />
          )}
          <input
            placeholder="Контрагент *"
            value={form.counterparty}
            onChange={e => setForm({ ...form, counterparty: e.target.value })}
            className="col-span-2"
          />
          <input
            placeholder="Сумма"
            value={form.amount}
            onChange={e => setForm({ ...form, amount: e.target.value })}
          />
          <input
            placeholder="Предмет договора"
            value={form.object}
            onChange={e => setForm({ ...form, object: e.target.value })}
            className="col-span-2"
          />
          <div className="col-span-2 flex gap-2">
            <button
              onClick={handleCreate}
              disabled={loading}
              className="btn"
            >
              {isLawyer ? 'Создать' : 'Отправить юристу'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="btn btn-secondary"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {filteredContracts.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-500">Договоров пока нет</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredContracts.map(c => (
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
                          <div className="mt-2 flex flex-wrap gap-2">
                    {isRequestedContract(c) ? (
                      <span className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-800 px-2 py-1 text-xs font-semibold">
                        На рассмотрении у юриста
                      </span>
                    ) : (
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                        c.status === 'SIGNED'
                        ? 'bg-green-100 text-green-700'
                        : c.status === 'ARCHIVED'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-primary-50 text-primary-700'
                      }`}>
                        {STATUS_LABELS[c.status]}
                      </span>
                    )}
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