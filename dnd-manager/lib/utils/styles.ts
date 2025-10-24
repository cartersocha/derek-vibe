/**
 * Shared CSS class utilities to reduce duplication
 */

export const CYBERPUNK_STYLES = {
  // Common border styles
  BORDER: {
    DEFAULT: 'border border-[#00ffff] border-opacity-30',
    HOVER: 'hover:border-[#ff00ff] hover:text-[#ff00ff]',
    FOCUS: 'focus:outline-none focus:ring-2 focus:ring-[#00ffff] focus:border-transparent',
    ACTIVE: 'border-[#ff00ff] text-[#ff00ff] shadow-lg shadow-[#ff00ff]/30',
  },
  
  // Background styles
  BACKGROUND: {
    CARD: 'bg-[#1a1a3e] bg-opacity-50 backdrop-blur-sm',
    INPUT: 'bg-[#0f0f23]',
    DARK: 'bg-[#0a0a1f]',
  },
  
  // Text styles
  TEXT: {
    CYAN: 'text-[#00ffff]',
    MAGENTA: 'text-[#ff00ff]',
    GRAY: 'text-gray-500',
    WHITE: 'text-white',
  },
  
  // Entity-specific colors with hover effects
  ENTITY: {
    CAMPAIGN: {
      PRIMARY: 'text-[#ff6b35]',
      HOVER: 'hover:text-[#ff6b35] hover:brightness-110',
      BORDER: 'border-[#ff6b35]/70',
      BACKGROUND: 'bg-[#ff6b35]/10',
    },
    ORGANIZATION: {
      PRIMARY: 'text-[#fcee0c]',
      HOVER: 'hover:text-[#fcee0c] hover:brightness-110',
      BORDER: 'border-[#fcee0c]/70',
      BACKGROUND: 'bg-[#fcee0c]/10',
    },
    NPC: {
      PRIMARY: 'text-[#ff6ad5]',
      HOVER: 'hover:text-[#ff6ad5] hover:brightness-110',
      BORDER: 'border-[#ff6ad5]/70',
      BACKGROUND: 'bg-[#ff6ad5]/10',
    },
    PLAYER: {
      PRIMARY: 'text-[#00ffff]',
      HOVER: 'hover:text-[#ff00ff]',
      BORDER: 'border-[#00ffff]/40',
      BACKGROUND: 'bg-[#0f0f23]',
    },
  },
  
  // Common component styles
  COMPONENT: {
    CARD: 'rounded-lg border border-[#00ffff] border-opacity-20 shadow-2xl p-6',
    INPUT: 'w-full px-4 py-3 rounded font-mono text-sm transition-colors duration-200',
    BUTTON: 'inline-flex items-center justify-center rounded border border-[#00ffff] border-opacity-30 text-[#00ffff] hover:border-[#ff00ff] hover:text-[#ff00ff] transition-colors',
    PRIMARY_BUTTON: 'bg-[#ff00ff] text-black hover:bg-[#ff00ff] hover:brightness-90 transition-all duration-200 shadow-lg shadow-[#ff00ff]/50',
  },
} as const

/**
 * Combines common input styles
 */
export function getInputStyles(additionalClasses = ''): string {
  return `${CYBERPUNK_STYLES.COMPONENT.INPUT} ${CYBERPUNK_STYLES.BACKGROUND.INPUT} ${CYBERPUNK_STYLES.BORDER.DEFAULT} ${CYBERPUNK_STYLES.TEXT.CYAN} ${CYBERPUNK_STYLES.BORDER.FOCUS} ${CYBERPUNK_STYLES.BORDER.HOVER} ${additionalClasses}`
}

/**
 * Combines common button styles
 */
export function getButtonStyles(additionalClasses = ''): string {
  return `${CYBERPUNK_STYLES.COMPONENT.BUTTON} ${additionalClasses}`
}

/**
 * Combines common card styles
 */
export function getCardStyles(additionalClasses = ''): string {
  return `${CYBERPUNK_STYLES.BACKGROUND.CARD} ${CYBERPUNK_STYLES.COMPONENT.CARD} ${additionalClasses}`
}
