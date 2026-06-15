'use client'

import { useState } from 'react'

// ─── Коммерческий отдел ───────────────────────────────────────────────────────

interface CommercialForm {
  // Контрагент
  counterpartyName: string
  director: string
  actingOn: string
  // Предмет и стоимость
  subject: string
  totalAmount: string
  equipmentAmount: string
  installationAmount: string
  vatRate: string
  // График оплаты
  advancePercent: string
  preShipmentPercent: string
  postAcceptancePercent: string
}

const EMPTY_COMMERCIAL: CommercialForm = {
  counterpartyName: '',
  director: '',
  actingOn: '',
  subject: '',
  totalAmount: '',
  equipmentAmount: '',
  installationAmount: '',
  vatRate: '',
  advancePercent: '',
  preShipmentPercent: '',
  postAcceptancePercent: '',
}

function CommercialReadView({ data }: { data: CommercialForm }) {
  const sections = [
    {
      title: 'Контрагент',
      rows: [
        { label: 'Наименование контрагента', value: data.counterpartyName },
        { label: 'Директор / подписант', value: data.director },
        { label: 'Действует на основании', value: data.actingOn },
      ],
    },
    {
      title: 'Предмет и стоимость',
      rows: [
        { label: 'Предмет договора', value: data.subject },
        { label: 'Общая сумма договора', value: data.totalAmount },
        { label: 'Сумма за оборудование', value: data.equipmentAmount },
        { label: 'Сумма за монтаж / работы', value: data.installationAmount },
        { label: 'Ставка НДС, %', value: data.vatRate },
      ],
    },
    {
      title: 'График оплаты',
      rows: [
        { label: 'Аванс за оборудование, %', value: data.advancePercent },
        { label: 'Оплата перед отгрузкой, %', value: data.preShipmentPercent },
        { label: 'Оплата после приёмки, %', value: data.postAcceptancePercent },
      ],
    },
  ]

  return (
    <div className="mt-2 rounded-lg border bg-gray-50 p-4 space-y-4 text-sm">
      {sections.map(section => (
        <div key={section.title}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{section.title}</p>
          <div className="space-y-1">
            {section.rows.map(row => row.value ? (
              <div key={row.label} className="grid grid-cols-[180px_1fr] gap-2">
                <span className="text-gray-500">{row.label}</span>
                <span className="text-gray-900 font-medium">{row.value}</span>
              </div>
            ) : null)}
          </div>
        </div>
      ))}
    </div>
  )
}

function CommercialEditForm({
  form, onChange, onSave, onCancel, saving, error, showCancel,
}: {
  form: CommercialForm
  onChange: (f: CommercialForm) => void
  onSave: () => void
  onCancel?: () => void
  saving: boolean
  error: string | null
  showCancel: boolean
}) {
  const f = form
  const set = (key: keyof CommercialForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...f, [key]: e.target.value })

  const required = 'border-red-200 focus:border-red-400'
  const inp = 'mt-1 w-full border rounded px-3 py-2 text-sm'

  return (
    <div className="mt-2 rounded-lg border bg-white p-4 space-y-5">

      {/* Контрагент */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Контрагент</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-600">Наименование контрагента <span className="text-red-500">*</span></label>
            <input value={f.counterpartyName} onChange={set('counterpartyName')} placeholder="ТОО «Пример»" className={inp} />
          </div>
          <div>
            <label className="text-xs text-gray-600">Директор / подписант <span className="text-red-500">*</span></label>
            <input value={f.director} onChange={set('director')} placeholder="Иванов Иван Иванович" className={inp} />
          </div>
          <div>
            <label className="text-xs text-gray-600">Действует на основании <span className="text-red-500">*</span></label>
            <input value={f.actingOn} onChange={set('actingOn')} placeholder="Устава / Доверенности №..." className={inp} />
          </div>
        </div>
      </div>

      {/* Предмет и стоимость */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Предмет и стоимость</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-600">Предмет договора <span className="text-red-500">*</span></label>
            <textarea value={f.subject} onChange={set('subject')} rows={2} placeholder="Поставка и монтаж оборудования..." className={inp} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600">Общая сумма договора <span className="text-red-500">*</span></label>
              <input value={f.totalAmount} onChange={set('totalAmount')} placeholder="5 000 000 ₸" className={inp} />
            </div>
            <div>
              <label className="text-xs text-gray-600">Ставка НДС, % <span className="text-red-500">*</span></label>
              <input value={f.vatRate} onChange={set('vatRate')} type="number" placeholder="12" className={inp} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600">Сумма за оборудование <span className="text-red-500">*</span></label>
              <input value={f.equipmentAmount} onChange={set('equipmentAmount')} type="number" placeholder="3 500 000" className={inp} />
            </div>
            <div>
              <label className="text-xs text-gray-600">Сумма за монтаж / работы <span className="text-red-500">*</span></label>
              <input value={f.installationAmount} onChange={set('installationAmount')} type="number" placeholder="1 500 000" className={inp} />
            </div>
          </div>
        </div>
      </div>

      {/* График оплаты */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">График оплаты</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-600">Аванс за оборудование, % <span className="text-red-500">*</span></label>
            <input value={f.advancePercent} onChange={set('advancePercent')} type="number" placeholder="30" className={inp} />
          </div>
          <div>
            <label className="text-xs text-gray-600">Оплата перед отгрузкой, % <span className="text-red-500">*</span></label>
            <input value={f.preShipmentPercent} onChange={set('preShipmentPercent')} type="number" placeholder="50" className={inp} />
          </div>
          <div>
            <label className="text-xs text-gray-600">Оплата после приёмки, % <span className="text-red-500">*</span></label>
            <input value={f.postAcceptancePercent} onChange={set('postAcceptancePercent')} type="number" placeholder="20" className={inp} />
          </div>
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button onClick={onSave} disabled={saving} className="btn text-sm">
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
        {showCancel && onCancel && (
          <button onClick={onCancel} className="btn btn-secondary text-sm">Отмена</button>
        )}
      </div>
    </div>
  )
}

// ─── Универсальная форма (все остальные отделы) ───────────────────────────────

interface GenericForm {
  description: string
  contact: string
  deadline: string
  budget: string
  notes: string
}

const EMPTY_GENERIC: GenericForm = { description: '', contact: '', deadline: '', budget: '', notes: '' }

function GenericReadView({ data }: { data: GenericForm }) {
  const rows = [
    { label: 'Описание', value: data.description },
    { label: 'Ответственный', value: data.contact },
    { label: 'Срок', value: data.deadline },
    { label: 'Бюджет / сумма', value: data.budget },
    { label: 'Примечания', value: data.notes },
  ]
  return (
    <div className="mt-2 rounded-lg border bg-gray-50 p-3 text-sm space-y-1">
      {rows.map(r => r.value ? (
        <div key={r.label}>
          <span className="text-xs text-gray-500">{r.label}: </span>
          <span className="text-gray-800 whitespace-pre-wrap">{r.value}</span>
        </div>
      ) : null)}
    </div>
  )
}

// ─── Основной компонент ───────────────────────────────────────────────────────

interface Props {
  contractId: string
  deptId: string
  departmentName: string
  initialSubmission?: Record<string, string> | null
  canEdit: boolean
  isLawyer: boolean
  onSaved?: () => void
}

export default function DepartmentSubmissionForm({
  contractId, deptId, departmentName, initialSubmission, canEdit, isLawyer, onSaved,
}: Props) {
  const isCommercial = departmentName === 'Коммерческий'

  const [commercialForm, setCommercialForm] = useState<CommercialForm>(
    isCommercial ? { ...EMPTY_COMMERCIAL, ...(initialSubmission ?? {}) } : EMPTY_COMMERCIAL
  )
  const [genericForm, setGenericForm] = useState<GenericForm>(
    !isCommercial ? { ...EMPTY_GENERIC, ...(initialSubmission ?? {}) } : EMPTY_GENERIC
  )

  const [editing, setEditing] = useState(!initialSubmission)
  const [saved, setSaved] = useState(!!initialSubmission)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasData = initialSubmission && Object.values(initialSubmission).some(v => v?.trim())

  async function handleSave() {
    const submission = isCommercial ? commercialForm : genericForm

    // Валидация обязательных полей для коммерческого
    if (isCommercial) {
      const req: (keyof CommercialForm)[] = [
        'counterpartyName', 'director', 'actingOn', 'subject',
        'totalAmount', 'equipmentAmount', 'installationAmount',
        'vatRate', 'advancePercent', 'preShipmentPercent', 'postAcceptancePercent',
      ]
      const missing = req.filter(k => !commercialForm[k].trim())
      if (missing.length) {
        setError('Заполните все обязательные поля')
        return
      }
    }

    setSaving(true)
    setError(null)
    const res = await fetch(`/api/contracts/${contractId}/departments/${deptId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submission }),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || 'Ошибка сохранения')
    } else {
      setSaved(true)
      setEditing(false)
      onSaved?.()
    }
    setSaving(false)
  }

  // Режим чтения для юриста или после сдачи
  if (isLawyer || !canEdit) {
    if (!hasData) return <p className="text-xs text-gray-400 mt-1 pl-1">Отдел ещё не заполнил данные</p>
    return isCommercial
      ? <CommercialReadView data={commercialForm} />
      : <GenericReadView data={genericForm} />
  }

  // Режим просмотра для отдела (уже сохранено)
  if (saved && !editing) {
    return (
      <div className="mt-1">
        {isCommercial
          ? <CommercialReadView data={commercialForm} />
          : <GenericReadView data={genericForm} />
        }
        <button onClick={() => setEditing(true)} className="mt-2 text-xs text-primary-600 hover:underline pl-1">
          Изменить
        </button>
      </div>
    )
  }

  // Режим редактирования
  return isCommercial ? (
    <CommercialEditForm
      form={commercialForm}
      onChange={setCommercialForm}
      onSave={handleSave}
      onCancel={saved ? () => setEditing(false) : undefined}
      saving={saving}
      error={error}
      showCancel={saved}
    />
  ) : (
    <div className="mt-2 pl-1">
      <div className="rounded-lg border bg-white p-3 space-y-2">
        <p className="text-xs font-medium text-gray-500 mb-1">Заполните данные для юриста</p>
        <div>
          <label className="text-xs text-gray-500">Описание</label>
          <textarea value={genericForm.description} onChange={e => setGenericForm({ ...genericForm, description: e.target.value })}
            rows={3} placeholder="Опишите что требуется от вашего отдела" className="mt-1 w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500">Ответственное лицо</label>
            <input value={genericForm.contact} onChange={e => setGenericForm({ ...genericForm, contact: e.target.value })}
              placeholder="ФИО / должность" className="mt-1 w-full border rounded px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Желаемый срок</label>
            <input value={genericForm.deadline} onChange={e => setGenericForm({ ...genericForm, deadline: e.target.value })}
              placeholder="до 01.08.2026" className="mt-1 w-full border rounded px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500">Бюджет / сумма</label>
          <input value={genericForm.budget} onChange={e => setGenericForm({ ...genericForm, budget: e.target.value })}
            placeholder="500 000 ₸" className="mt-1 w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Примечания</label>
          <textarea value={genericForm.notes} onChange={e => setGenericForm({ ...genericForm, notes: e.target.value })}
            rows={2} placeholder="Дополнительная информация" className="mt-1 w-full border rounded px-3 py-2 text-sm" />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button onClick={handleSave} disabled={saving} className="btn text-sm">{saving ? 'Сохранение...' : 'Сохранить'}</button>
          {saved && <button onClick={() => setEditing(false)} className="btn btn-secondary text-sm">Отмена</button>}
        </div>
      </div>
    </div>
  )
}
