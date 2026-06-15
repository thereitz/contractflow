'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import ArchiveButton from '@/components/ArchiveButton'
import DepartmentFiles from '@/components/DepartmentFiles'
import DepartmentSubmissionForm from '@/components/DepartmentSubmissionForm'

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
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [allDepts, setAllDepts] = useState<any[]>([])
  const [selectedDepts, setSelectedDepts] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const [returnComment, setReturnComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDeptForm, setShowDeptForm] = useState(false)
  const [showReturnForm, setShowReturnForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', counterparty: '', object: '', amount: '' })

  async function load() {
    if (!id) return
    setLoading(true)
    setError(null)

    try {
      const [cRes, dRes, uRes] = await Promise.all([
        fetch(`/api/contracts/${id}`),
        fetch('/api/departments'),
        fetch('/api/auth/me'),
      ])

      const [c, d, u] = await Promise.all([
        cRes.json(),
        dRes.json(),
        uRes.json(),
      ])

      if (!cRes.ok) throw new Error(c.error || 'Ошибка загрузки договора')
      if (!dRes.ok) throw new Error(d.error || 'Ошибка загрузки отделов')
      if (!uRes.ok) throw new Error(u.error || 'Ошибка загрузки пользователя')

      setContract(c.data)
      setAllDepts(d.data || [])
      setCurrentUser(u.data)
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Произошла ошибка при загрузке данных')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (id) load() }, [id])

  async function handleAssignDepts() {
    if (!selectedDepts.length) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/contracts/${id}/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentIds: selectedDepts }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Не удалось назначить отделы')

      setSelectedDepts([])
      setShowDeptForm(false)
      await load()
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Не удалось назначить отделы')
    } finally {
      setLoading(false)
    }
  }

  async function handleSendCollecting() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/contracts/${id}/send-collecting`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Не удалось отправить на сбор информации')
      await load()
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Не удалось отправить на сбор информации')
    } finally {
      setLoading(false)
    }
  }

  async function handleSendApproval() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/contracts/${id}/send-approval`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Не удалось отправить на согласование')
      await load()
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Не удалось отправить на согласование')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeptStatus(deptId: string, status: string) {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/contracts/${id}/departments/${deptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Не удалось обновить статус отдела')
      await load()
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Не удалось обновить статус отдела')
    } finally {
      setLoading(false)
    }
  }

  async function handleApproval(action: string) {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/contracts/${id}/approvals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, comment: returnComment }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Не удалось выполнить действие согласования')
      setReturnComment('')
      setShowReturnForm(false)
      await load()
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Не удалось выполнить действие согласования')
    } finally {
      setLoading(false)
    }
  }

  async function handleEdit() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/contracts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Не удалось сохранить')
      setEditMode(false)
      await load()
    } catch (err: any) {
      setError(err?.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleComment() {
    if (!comment.trim()) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/contracts/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: comment }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Не удалось добавить комментарий')
      setComment('')
      await load()
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Не удалось добавить комментарий')
    } finally {
      setLoading(false)
    }
  }

  function toggleDept(deptId: string) {
    setSelectedDepts(prev =>
      prev.includes(deptId) ? prev.filter(d => d !== deptId) : [...prev, deptId]
    )
  }

  if (!contract) return <div>Загрузка...</div>

  const assignedIds = contract.contractDepartments?.map((cd: any) => cd.departmentId) ?? []
  const unassignedDepts = allDepts.filter(d => !assignedIds.includes(d.id))
  const isLawyer = ['LAWYER', 'SUPER_ADMIN'].includes(currentUser?.role)
  const isHead = ['HEAD', 'SUPER_ADMIN'].includes(currentUser?.role)
  const myDept = contract.contractDepartments?.find(
    (cd: any) => cd.departmentId === currentUser?.departmentId
  )

  const statusClass = contract.status === 'SIGNED'
    ? 'bg-green-100 text-green-700'
    : contract.status === 'ARCHIVED'
    ? 'bg-gray-100 text-gray-700'
    : 'bg-primary-50 text-primary-700'

  const isRequestedContract = contract.status === 'DRAFT' && contract.title?.startsWith('Запрос:')

  return (
    <div className="card max-w-4xl">
      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Заголовок + статус + кнопка архива */}
      <div className="grid gap-4 md:grid-cols-[1fr_auto] items-start mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{contract.title}</h1>
          <p className="text-gray-500 text-sm mt-2">{contract.counterparty}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${statusClass}`}>
            {STATUS_LABELS[contract.status]}
          </span>
          {isRequestedContract && (
            <span className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-800 px-3 py-1 text-sm font-semibold">
              Запрошен юристом
            </span>
          )}
          {isLawyer && !['SIGNED', 'ARCHIVED'].includes(contract.status) && !editMode && (
            <button
              onClick={() => {
                setEditForm({
                  title: contract.title,
                  counterparty: contract.counterparty,
                  object: contract.object || '',
                  amount: contract.amount ? String(contract.amount) : '',
                })
                setEditMode(true)
              }}
              className="btn btn-secondary text-sm"
            >
              Редактировать
            </button>
          )}
          {contract.status === 'SIGNED' &&
           ['SUPER_ADMIN', 'ADMIN', 'LAWYER'].includes(currentUser?.role) && (
            <ArchiveButton
              contractId={contract.id}
              contractTitle={contract.title}
            />
          )}
        </div>
      </div>

      {/* Форма редактирования */}
      {editMode && (
        <div className="mb-6 rounded-lg border bg-gray-50 p-4 grid grid-cols-2 gap-3">
          <input
            placeholder="Название *"
            value={editForm.title}
            onChange={e => setEditForm({ ...editForm, title: e.target.value })}
            className="col-span-2"
          />
          <input
            placeholder="Контрагент *"
            value={editForm.counterparty}
            onChange={e => setEditForm({ ...editForm, counterparty: e.target.value })}
            className="col-span-2"
          />
          <input
            placeholder="Сумма"
            value={editForm.amount}
            onChange={e => setEditForm({ ...editForm, amount: e.target.value })}
          />
          <input
            placeholder="Предмет договора"
            value={editForm.object}
            onChange={e => setEditForm({ ...editForm, object: e.target.value })}
          />
          <div className="col-span-2 flex gap-2">
            <button onClick={handleEdit} disabled={loading} className="btn">Сохранить</button>
            <button onClick={() => setEditMode(false)} className="btn btn-secondary">Отмена</button>
          </div>
        </div>
      )}

      {/* Основные поля */}
      <div className="grid gap-4 md:grid-cols-3 mb-6 text-sm">
        <div className="rounded-lg border bg-gray-50 p-4">
          <p className="text-gray-500">Инициатор</p>
          <p className="mt-2 font-medium text-gray-900">{contract.initiator.name}</p>
        </div>
        <div className="rounded-lg border bg-gray-50 p-4">
          <p className="text-gray-500">Сумма</p>
          <p className="mt-2 font-medium text-gray-900">{contract.amount || '—'}</p>
        </div>
        <div className="rounded-lg border bg-gray-50 p-4 md:col-span-1">
          <p className="text-gray-500">Предмет</p>
          <p className="mt-2 font-medium text-gray-900">{contract.object || '—'}</p>
        </div>
      </div>

      {/* Файлы */}
      <div className="mb-6">
        <h2 className="font-medium mb-2">Файлы</h2>
        {!contract.files || contract.files.length === 0
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
          <div className="flex gap-2 flex-wrap">
            {isLawyer && unassignedDepts.length > 0 && (
              <button onClick={() => setShowDeptForm(!showDeptForm)}
                  className="btn btn-secondary text-sm px-3 py-1">
                  + Назначить
                </button>
            )}
            {isLawyer && contract.status === 'DRAFT' && (contract.contractDepartments?.length ?? 0) > 0 && (
              <button onClick={handleSendCollecting} disabled={loading} className="btn">
                Запустить сбор информации
              </button>
            )}
            {isLawyer && contract.status === 'REVIEWING' && (
              <button onClick={handleSendApproval} disabled={loading}
                className="btn">
                Отправить на согласование
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
              className="btn mt-2">
              Сохранить
            </button>
          </div>
        )}

        {(contract.contractDepartments?.length ?? 0) === 0
          ? <p className="text-sm text-gray-500">Отделы не назначены</p>
          : contract.contractDepartments.map((cd: any) => (
            <div key={cd.id} className="border-b py-3">
              <div className="text-sm flex justify-between items-center">
                <span className="font-medium">{cd.department.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">{DEPT_STATUS_LABELS[cd.status]}</span>
                  {isHead && currentUser?.departmentId === cd.departmentId
                    && contract.status === 'COLLECTING'
                    && cd.status !== 'SUBMITTED' && (
                    <button onClick={() => handleDeptStatus(cd.departmentId, 'SUBMITTED')}
                      disabled={loading}
                      className="btn btn-secondary text-xs px-2 py-1">
                      Подтвердить сдачу
                    </button>
                  )}
                </div>
              </div>
              {(isLawyer || currentUser?.departmentId === cd.departmentId) && (
                <>
                  <DepartmentSubmissionForm
                    contractId={id as string}
                    deptId={cd.departmentId}
                    departmentName={cd.department.name}
                    initialSubmission={cd.submission ?? null}
                    canEdit={
                      (isHead || currentUser?.role === 'EMPLOYEE') &&
                      currentUser?.departmentId === cd.departmentId &&
                      cd.status !== 'SUBMITTED' &&
                      contract.status === 'COLLECTING'
                    }
                    isLawyer={isLawyer}
                    onSaved={load}
                  />
                  <DepartmentFiles
                    contractId={id as string}
                    deptId={cd.departmentId}
                    canUpload={
                      (isHead || currentUser?.role === 'EMPLOYEE') &&
                      currentUser?.departmentId === cd.departmentId &&
                      cd.status !== 'SUBMITTED' &&
                      contract.status === 'COLLECTING'
                    }
                  />
                </>
              )}
            </div>
          ))
        }
      </div>

      {/* Согласование */}
      {isHead && contract.status === 'APPROVAL' && (
        <div className="mb-6 border rounded p-4 bg-gray-50">
          <h2 className="font-medium mb-3">Согласование</h2>
          {!showReturnForm ? (
            <div className="flex gap-2">
              <button onClick={() => handleApproval('APPROVED')} disabled={loading}
                className="btn">
                Согласовать
              </button>
              <button onClick={() => setShowReturnForm(true)}
                className="btn btn-secondary">
                Вернуть на доработку
              </button>
            </div>
          ) : (
            <div>
              <textarea value={returnComment} onChange={e => setReturnComment(e.target.value)}
                placeholder="Причина возврата..."
                className="mt-1 w-full mb-2" rows={3} />
              <div className="flex gap-2">
                <button onClick={() => handleApproval('RETURNED')} disabled={loading}
                  className="btn btn-secondary">
                  Подтвердить возврат
                </button>
                <button onClick={() => setShowReturnForm(false)}
                  className="btn btn-secondary">
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Комментарии */}
      <div className="mb-6">
        <h2 className="font-medium mb-2">Комментарии</h2>
        {!contract.comments || contract.comments.length === 0
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
        {(!contract.activityLogs || contract.activityLogs.length === 0) ? (
          <p className="text-sm text-gray-500">Записей истории нет</p>
        ) : (
          contract.activityLogs.map((log: any) => (
            <div key={log.id} className="text-sm border-b py-2 flex justify-between">
              <span>{log.user?.name || 'Система'} — {log.action}</span>
              <span className="text-gray-400">{new Date(log.createdAt).toLocaleString('ru-RU')}</span>
            </div>
          ))
        )}
      </div>

    </div>
  )
}
