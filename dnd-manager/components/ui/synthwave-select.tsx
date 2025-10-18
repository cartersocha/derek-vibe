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
          className={`w-full appearance-none px-4 py-3 pr-10 bg-[#0f0f23] border border-[#00ffff] border-opacity-30 text-[#00ffff] rounded focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent focus:shadow-lg focus:shadow-[#ff00ff]/30 font-mono text-sm transition-colors duration-200 hover:border-[#ff00ff] hover:text-[#ff00ff] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
          {...rest}
        >
          {children}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-[#ff00ff]">
          ▼
        </span>
      </div>
    )
  }
)

SynthwaveSelect.displayName = 'SynthwaveSelect'

export default SynthwaveSelect
