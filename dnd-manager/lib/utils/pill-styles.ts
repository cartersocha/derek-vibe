import { cn } from '../utils'

/**
 * Standardized pill styling system for consistent sizing throughout the application
 */

export type PillSize = 'tiny' | 'small' | 'medium' | 'large'
export type PillVariant = 'default' | 'player' | 'npc' | 'organization' | 'session' | 'date' | 'campaign'

/**
 * Base pill classes that all pills should use
 */
export const getPillBaseClasses = (size: PillSize = 'tiny') => {
  const sizeClasses = {
    tiny: 'px-[var(--pill-padding-x-small)] py-[var(--pill-padding-y-small)] text-[10px] tracking-widest',
    small: 'px-[var(--pill-padding-x-small)] py-[var(--pill-padding-y-small)] text-[10px] tracking-widest',
    medium: 'px-[var(--pill-padding-x-medium)] py-[var(--pill-padding-y-medium)] text-xs tracking-widest',
    large: 'px-[var(--pill-padding-x-large)] py-[var(--pill-padding-y-large)] text-sm tracking-[var(--pill-tracking-large)]'
  }

  return cn(
    // Mark as a pill and ensure we don't inherit mobile 44px min touch targets for generic buttons
    // Allow text wrapping inside pills and prevent overflow beyond container width
    'pill inline-flex items-center font-mono uppercase transition-colors focus:outline-none focus-visible:ring-2 min-h-0 min-w-0 max-w-full whitespace-normal break-words text-left',
    sizeClasses[size]
  )
}

/**
 * Pill variant classes for different types of content
 */
export const getPillVariantClasses = (variant: PillVariant, size: PillSize = 'small') => {
  const radiusClass = ''
  
  const variantClasses = {
    default: cn(
      'border border-[var(--cyber-cyan)] border-opacity-40 bg-[var(--bg-dark)] text-[var(--cyber-cyan)] hover-cyber focus-visible:ring-[var(--cyber-cyan)]',
      radiusClass
    ),
    player: cn(
      'border border-[var(--cyber-cyan)] border-opacity-40 bg-[var(--bg-dark)] text-[var(--cyber-cyan)] hover-cyber focus-visible:ring-[var(--cyber-cyan)]',
      radiusClass
    ),
    npc: cn(
      'border border-[var(--cyber-magenta)]/40 bg-[var(--bg-dark)] text-[var(--cyber-magenta)] hover:text-[var(--cyber-cyan)] hover:border-[var(--cyber-cyan)]/40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyber-magenta)]',
      radiusClass
    ),
    organization: cn(
      'border border-[var(--cyber-magenta)]/40 bg-[var(--bg-dark)] text-[var(--cyber-magenta)] hover:text-[var(--cyber-cyan)] hover:border-[var(--cyber-cyan)]/40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyber-magenta)]',
      radiusClass
    ),
    session: cn(
      'border border-[var(--yellow-400)]/40 bg-[var(--bg-dark)] text-[var(--yellow-400)] transition hover:text-[var(--yellow-500)] hover:border-[var(--yellow-500)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--yellow-400)]',
      radiusClass
    ),
    date: cn(
      'border border-[var(--orange-400)]/40 bg-[var(--bg-dark)] text-[var(--orange-400)]',
      radiusClass
    ),
    campaign: cn(
      'border border-[var(--orange-400)]/40 bg-[var(--bg-dark)] text-[var(--orange-400)]',
      radiusClass
    )
  }

  return variantClasses[variant]
}

/**
 * Complete pill classes combining base and variant
 */
export const getPillClasses = (variant: PillVariant = 'default', size: PillSize = 'tiny') => {
  return cn(
    getPillBaseClasses(size),
    getPillVariantClasses(variant, size)
  )
}

/**
 * Dashed pill classes for "more" buttons
 */
export const getDashedPillClasses = (variant: PillVariant = 'default', size: PillSize = 'tiny') => {
  const radiusClass = ''
  
  const dashedClasses = {
    default: cn(
      'border border-dashed border-[var(--cyber-cyan)]/50 text-[var(--cyber-cyan)] hover-cyber transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyber-cyan)]',
      radiusClass
    ),
    player: cn(
      'border border-dashed border-[var(--cyber-cyan)]/50 text-[var(--cyber-cyan)] hover-cyber transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyber-cyan)]',
      radiusClass
    ),
    npc: cn(
      'border border-dashed border-[var(--cyber-magenta)]/50 text-[var(--cyber-magenta)] hover-cyber transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyber-magenta)]',
      radiusClass
    ),
    organization: cn(
      'border border-dashed border-[var(--cyber-magenta)]/50 text-[var(--cyber-magenta)] hover:text-[var(--cyber-cyan)] hover:border-[var(--cyber-cyan)]/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cyber-magenta)]',
      radiusClass
    ),
    session: cn(
      'border border-dashed border-[var(--yellow-400)]/50 text-[var(--yellow-400)] hover:text-[var(--yellow-500)] hover:border-[var(--yellow-500)]/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--yellow-400)]',
      radiusClass
    ),
    date: cn(
      'border border-dashed border-[var(--orange-400)]/50 text-[var(--orange-400)] hover:text-[var(--orange-500)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orange-400)]',
      radiusClass
    ),
    campaign: cn(
      'border border-dashed border-[var(--orange-400)]/50 text-[var(--orange-400)] hover:text-[var(--orange-500)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--orange-400)]',
      radiusClass
    )
  }

  return cn(
    getPillBaseClasses(size),
    dashedClasses[variant]
  )
}
