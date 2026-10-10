import React, { useState, useCallback, useEffect } from 'react'
import { ToastContext } from './ToastContext'
import type { ToastMessage } from './ToastContext'
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

let globalShowToast: ((message: string, type?: ToastType) => void) | null = null

export const toast = {
  success: (message: string) => globalShowToast?.(message, 'success'),
  error: (message: string) => globalShowToast?.(message, 'error'),
  warning: (message: string) => globalShowToast?.(message, 'warning'),
  info: (message: string) => globalShowToast?.(message, 'info'),
  show: (message: string, type: ToastType = 'info') => globalShowToast?.(message, type),
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev: ToastMessage[]) => [...prev, { id, message, type }])

    setTimeout(() => {
      setToasts((prev: ToastMessage[]) => prev.filter((t: ToastMessage) => t.id !== id))
    }, 4000)
  }, [])

  useEffect(() => {
    globalShowToast = showToast
    return () => {
      globalShowToast = null
    }
  }, [showToast])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          maxWidth: 420,
          width: 'calc(100vw - 48px)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t: ToastMessage) => {
          let bg = '#ffffff'
          let border = '#e2e8f0'
          let textColor = '#1e293b'
          let icon = <Info style={{ width: 18, height: 18, color: '#0284c7', flexShrink: 0 }} />

          if (t.type === 'success') {
            bg = '#f0fdf4'
            border = '#bbf7d0'
            textColor = '#166534'
            icon = <CheckCircle2 style={{ width: 18, height: 18, color: '#16a34a', flexShrink: 0 }} />
          } else if (t.type === 'error') {
            bg = '#fef2f2'
            border = '#fecaca'
            textColor = '#991b1b'
            icon = <AlertCircle style={{ width: 18, height: 18, color: '#dc2626', flexShrink: 0 }} />
          } else if (t.type === 'warning') {
            bg = '#fffbeb'
            border = '#fde68a'
            textColor = '#92400e'
            icon = <AlertTriangle style={{ width: 18, height: 18, color: '#d97706', flexShrink: 0 }} />
          }

          return (
            <div
              key={t.id}
              style={{
                pointerEvents: 'auto',
                backgroundColor: bg,
                border: `1px solid ${border}`,
                color: textColor,
                padding: '12px 16px',
                borderRadius: 8,
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                fontSize: 13,
                fontWeight: 600,
                lineHeight: 1.4,
                animation: 'fadeSlideDown 0.25s ease-out',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                {icon}
                <span>{t.message}</span>
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'flex',
                  alignItems: 'center',
                  color: textColor,
                  opacity: 0.6,
                }}
                aria-label="Close"
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
