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
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    const res = await fetch(`/api/contracts/${id}`)
    const json = await res.json()
    setContract(json.data)
  }

  useEffect(() => { if (id) load() }, [id])

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

  if (!contract) return <div className="p-6">Загрузка...</div>

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
      {contract.contractDepartments.length > 0 && (
        <div className="mb-6">
          <h2 className="font-medium mb-2">Отделы</h2>
          {contract.contractDepartments.map((cd: any) => (
            <div key={cd.id} className="text-sm border-b py-2 flex justify-between">
              <span>{cd.department.name}</span>
              <span>{DEPT_STATUS_LABELS[cd.status]}</span>
            </div>
          ))}
        </div>
      )}

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
          <input
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Написать комментарий..."
            className="border rounded px-3 py-2 text-sm flex-1"
          />
          <button
            onClick={handleComment}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
          >
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