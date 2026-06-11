'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Черновик',
  COLLECTING: 'Сбор информации',
  REVIEWING: 'На рассмотрении',
  APPROVAL: 'На согласовании',
  SIGNED: 'Подписан',
  ARCHIVED: 'Архив',
}

const DEPT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ожидает',
  IN_PROGRESS: 'В работе',
  SUBMITTED: 'Сдано',
}

export default function ContractPage() {
  const { id } = useParams()
  const [contract, setContract] = useState<any>(null)
  const [allDepts, setAllDepts] = useState<any[]>([])
  const [selectedDepts, setSelectedDepts] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDeptForm, setShowDeptForm] = useState(false)

  async function load() {
    const [c, d] = await Promise.all([
      fetch(`/api/contracts/${id}`).then(r => r.json()),
      fetch('/api/departments').then(r => r.json()),
    ])
    setContract(c.data)
    setAllDepts(d.data || [])
  }

  useEffect(() => { if (id) load() }, [id])

  async function handleAssignDepts() {
    if (!selectedDepts.length) return
    setLoading(true)
    await fetch(`/api/contracts/${id}/departments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ departmentIds: selectedDepts }),
    })
    setSelectedDepts([])
    setShowDeptForm(false)
    await load()
    setLoading(false)
  }

  async function handleSendCollecting() {
    setLoading(true)
    const res = await fetch(`/api/contracts/${id}/send-collecting`, { method: 'POST' })
    const json = await res.json()
    if (!res.ok) alert(json.error)
    await load()
    setLoading(false)
  }

  async function handleComment() {
    if (!comment.trim()) return
    setLoading(true)
    await fetch(`/api/contracts/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: comment }),
    })
    setComment('')
    await load()
    setLoading(false)
  }

  function toggleDept(deptId: string) {
    setSelectedDepts(prev =>
      prev.includes(deptId) ? prev.filter(d => d !== deptId) : [...prev, deptId]
    )
  }

  if (!contract) return <div className="p-6">Загрузка...</div>

  const assignedIds = contract.contractDepartments.map((cd: any) => cd.departmentId)
  const unassignedDepts = allDepts.filter(d => !assignedIds.includes(d.id))

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{contract.title}</h1>
          <p className="text-gray-500 text-sm mt-1">{contract.counterparty}</p>
        </div>
        <span className="border rounded px-3 py-1 text-sm">
          {STATUS_LABELS[contract.status]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
        <div><span className="text-gray-500">Инициатор:</span> {contract.initiator.name}</div>
        <div><span className="text-gray-500">Сумма:</span> {contract.amount || '—'}</div>
        <div className="col-span-2"><span className="text-gray-500">Предмет:</span> {contract.object || '—'}</div>
      </div>

      {/* Файлы */}
      <div className="mb-6">
        <h2 className="font-medium mb-2">Файлы</h2>
        {contract.files.length === 0
          ? <p className="text-sm text-gray-500">Файлов нет</p>
          : contract.files.map((f: any) => (
            <div key={f.id} className="text-sm border-b py-2 flex justify-between">
              <span>v{f.version} — {f.filename}</span>
              <span className="text-gray-400">{new Date(f.createdAt).toLocaleDateString('ru-RU')}</span>
            </div>
          ))
        }
      </div>

      {/* Отделы */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-medium">Отделы</h2>
          <div className="flex gap-2">
            {unassignedDepts.length > 0 && (
              <button onClick={() => setShowDeptForm(!showDeptForm)}
                className="text-sm border px-3 py-1 rounded">
                + Назначить
              </button>
            )}
            {contract.status === 'DRAFT' && contract.contractDepartments.length > 0 && (
              <button onClick={handleSendCollecting} disabled={loading}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded">
                Отправить на сбор информации
              </button>
            )}
          </div>
        </div>

        {showDeptForm && (
          <div className="border rounded p-3 mb-3 bg-gray-50">
            {unassignedDepts.map(d => (
              <label key={d.id} className="flex items-center gap-2 text-sm py-1">
                <input type="checkbox" checked={selectedDepts.includes(d.id)}
                  onChange={() => toggleDept(d.id)} />
                {d.name}
              </label>
            ))}
            <button onClick={handleAssignDepts} disabled={loading}
              className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm">
              Сохранить
            </button>
          </div>
        )}

        {contract.contractDepartments.length === 0
          ? <p className="text-sm text-gray-500">Отделы не назначены</p>
          : contract.contractDepartments.map((cd: any) => (
            <div key={cd.id} className="text-sm border-b py-2 flex justify-between">
              <span>{cd.department.name}</span>
              <span>{DEPT_STATUS_LABELS[cd.status]}</span>
            </div>
          ))
        }
      </div>

      {/* Комментарии */}
      <div className="mb-6">
        <h2 className="font-medium mb-2">Комментарии</h2>
        {contract.comments.length === 0
          ? <p className="text-sm text-gray-500 mb-3">Комментариев нет</p>
          : contract.comments.map((c: any) => (
            <div key={c.id} className="border-b py-2">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{c.author.name}</span>
                <span>{new Date(c.createdAt).toLocaleString('ru-RU')}</span>
              </div>
              <p className="text-sm">{c.text}</p>
            </div>
          ))
        }
        <div className="flex gap-2 mt-3">
          <input value={comment} onChange={e => setComment(e.target.value)}
            placeholder="Написать комментарий..."
            className="border rounded px-3 py-2 text-sm flex-1" />
          <button onClick={handleComment} disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm">
            Отправить
          </button>
        </div>
      </div>

      {/* История */}
      <div>
        <h2 className="font-medium mb-2">История</h2>
        {contract.activityLogs.map((log: any) => (
          <div key={log.id} className="text-sm border-b py-2 flex justify-between">
            <span>{log.user.name} — {log.action}</span>
            <span className="text-gray-400">{new Date(log.createdAt).toLocaleString('ru-RU')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}