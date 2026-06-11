'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ArchiveButtonProps {
  contractId: string
  contractTitle: string
  // Рендерить кнопку только если статус SIGNED и роль подходящая —
  // проверку делает родитель, компонент просто отображает и выполняет действие
}

export default function ArchiveButton({ contractId, contractTitle }: ArchiveButtonProps) {
  const router = useRouter()
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleArchive = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/contracts/${contractId}/archive`, {
        method: 'POST',
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Ошибка архивирования')
        return
      }
      setShowConfirm(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        style={{
          padding: '8px 18px',
          background: '#f3f4f6',
          color: '#374151',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 500,
          fontSize: '0.875rem',
        }}
      >
        📦 В архив
      </button>

      {/* Модальное подтверждение */}
      {showConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowConfirm(false)
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '420px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
          >
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem', fontWeight: 700 }}>
              Перевести в архив?
            </h3>
            <p style={{ margin: '0 0 1.5rem', color: '#4b5563', fontSize: '0.925rem' }}>
              Договор{' '}
              <strong>«{contractTitle}»</strong> будет помещён в архив.
              Это действие необратимо.
            </p>

            {error && (
              <p style={{ color: '#dc2626', marginBottom: '1rem', fontSize: '0.875rem' }}>
                ⚠️ {error}
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                style={{
                  padding: '8px 18px',
                  background: '#fff',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                }}
              >
                Отмена
              </button>
              <button
                onClick={handleArchive}
                disabled={loading}
                style={{
                  padding: '8px 18px',
                  background: loading ? '#9ca3af' : '#374151',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                }}
              >
                {loading ? 'Архивируем...' : 'Да, в архив'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
