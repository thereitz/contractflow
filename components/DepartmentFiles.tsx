'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface DepartmentFile {
  id: string
  filename: string
  createdAt: string
  uploadedBy: string
  uploader: { name: string }
  signedUrl: string | null
}

interface DepartmentFilesProps {
  contractId: string
  deptId: string
  canUpload: boolean
}

export default function DepartmentFiles({ contractId, deptId, canUpload }: DepartmentFilesProps) {
  const [files, setFiles] = useState<DepartmentFile[]>([])
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function fetchFiles() {
    const res = await fetch(`/api/contracts/${contractId}/departments/${deptId}/files`)
    if (res.ok) {
      const json = await res.json()
      setFiles(json.data ?? [])
    }
  }

  useEffect(() => { fetchFiles() }, [contractId, deptId])

  async function uploadFile(file: File) {
    setUploading(true)
    setError(null)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`/api/contracts/${contractId}/departments/${deptId}/files`, {
      method: 'POST',
      body: fd,
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || 'Ошибка загрузки')
    } else {
      await fetchFiles()
    }
    setUploading(false)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }, [contractId, deptId])

  return (
    <div className="mt-2 pl-1">
      {canUpload && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`mb-2 flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed px-4 py-3 text-sm transition-colors ${
            dragging ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            onChange={e => { const f = e.target.files?.[0]; if (f) uploadFile(f); e.target.value = '' }}
          />
          {uploading
            ? <span className="text-gray-500">Загрузка...</span>
            : <span className="text-gray-500">Прикрепить файл <span className="text-gray-400">(PDF, DOC, XLS, PNG, JPG · до 20 МБ)</span></span>
          }
        </div>
      )}

      {error && (
        <p className="mb-2 text-xs text-red-600">{error}</p>
      )}

      {files.length > 0 && (
        <div className="space-y-1">
          {files.map(f => (
            <div key={f.id} className="flex items-center justify-between rounded bg-gray-50 px-3 py-1.5 text-xs">
              <div>
                <span className="font-medium text-gray-800">{f.filename}</span>
                <span className="ml-2 text-gray-400">{f.uploader.name} · {new Date(f.createdAt).toLocaleDateString('ru-RU')}</span>
              </div>
              {f.signedUrl && (
                <a
                  href={f.signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-3 text-primary-600 hover:underline shrink-0"
                >
                  Скачать
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
