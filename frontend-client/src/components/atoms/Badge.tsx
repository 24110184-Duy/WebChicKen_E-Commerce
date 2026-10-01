import React from 'react'

export interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const variantStyles = {
    primary: 'bg-[var(--color-primary-light)] text-[var(--color-primary)] border-[var(--color-primary)]',
    success: 'bg-emerald-50 text-[var(--color-success)] border-emerald-300',
    warning: 'bg-amber-50 text-amber-700 border-amber-300',
    danger: 'bg-rose-50 text-[var(--color-danger)] border-rose-300',
    info: 'bg-sky-50 text-[var(--color-info)] border-sky-300',
    default: 'bg-gray-100 text-gray-700 border-gray-200',
  }[variant]

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${variantStyles} ${className}`}
    >
      {children}
    </span>
  )
}
