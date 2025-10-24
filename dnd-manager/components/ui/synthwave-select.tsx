'use client'

import { forwardRef, type SelectHTMLAttributes } from 'react'

type SynthwaveSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  containerClassName?: string
}

const SynthwaveSelect = forwardRef<HTMLSelectElement, SynthwaveSelectProps>(
  ({ className = '', containerClassName = '', children, ...rest }, ref) => {
    return (
      <div className={`relative ${containerClassName}`}>
        <select
          ref={ref}
          className={`w-full appearance-none px-4 py-3 pr-10 bg-[var(--bg-dark)] border border-[var(--cyber-cyan)] border-opacity-30 text-[var(--cyber-cyan)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--cyber-cyan)] focus:border-transparent focus:shadow-lg focus:shadow-[var(--cyber-magenta)]/30 font-mono text-sm transition-colors duration-200 hover:border-[var(--cyber-magenta)] hover:text-[var(--cyber-magenta)] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
          {...rest}
        >
          {children}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-[var(--cyber-magenta)]">
          ▼
        </span>
      </div>
    )
  }
)

SynthwaveSelect.displayName = 'SynthwaveSelect'

export default SynthwaveSelect
