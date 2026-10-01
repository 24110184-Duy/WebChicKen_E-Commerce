import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, id, className = '', ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="flex flex-col gap-1 w-full text-left">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-[var(--color-text-secondary)]">
            {label} {props.required && <span className="text-[var(--color-danger)]">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-3 py-2 text-sm bg-white border rounded transition-colors duration-150 outline-none
            ${
              error
                ? 'border-[var(--color-danger)] focus:ring-1 focus:ring-[var(--color-danger)]'
                : 'border-[var(--color-border)] hover:border-[var(--color-border-hover)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]'
            }
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-[var(--color-danger)]">{error}</span>}
        {!error && helperText && <span className="text-xs text-[var(--color-text-muted)]">{helperText}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'
