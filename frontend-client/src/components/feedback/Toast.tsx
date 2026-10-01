import React, { useState, useCallback } from 'react'
import { ToastContext } from './ToastContext'
import type { ToastMessage } from './ToastContext'

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev: ToastMessage[]) => [...prev, { id, message, type }])

    setTimeout(() => {
      setToasts((prev: ToastMessage[]) => prev.filter((t: ToastMessage) => t.id !== id))
    }, 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t: ToastMessage) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-2.5 rounded shadow-lg text-sm font-medium flex items-center gap-2 text-white transition-all transform duration-200 ${
              t.type === 'success'
                ? 'bg-emerald-600'
                : t.type === 'error'
                ? 'bg-rose-600'
                : t.type === 'warning'
                ? 'bg-amber-600'
                : 'bg-slate-800'
            }`}
          >
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
