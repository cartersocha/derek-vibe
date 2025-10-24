/**
 * Shared CSS class utilities to reduce duplication
 */

export const CYBERPUNK_STYLES = {
  // Background styles using CSS variables
  BACKGROUND: {
    MAIN: 'bg-[var(--bg-dark)]',
    CARD: 'bg-[var(--bg-card)] bg-opacity-50 backdrop-blur-sm',
    INPUT: 'bg-[var(--bg-dark)]',
  },
  
  // Text styles using CSS variables
  TEXT: {
    PRIMARY: 'text-[var(--text-primary)]',
    SECONDARY: 'text-[var(--text-secondary)]',
    MUTED: 'text-[var(--text-muted)]',
    CYAN: 'text-[var(--cyber-cyan)]',
    MAGENTA: 'text-[var(--cyber-magenta)]',
    SUCCESS: 'semantic-success',
    WARNING: 'semantic-warning',
    ERROR: 'semantic-error',
  },
  
  // Border styles using CSS variables
  BORDER: {
    DEFAULT: 'border border-[var(--cyber-cyan)] border-opacity-30',
    FOCUS: 'focus:outline-none focus:ring-2 focus:ring-[var(--cyber-cyan)] focus:border-transparent',
    ACTIVE: 'border-[var(--cyber-magenta)] text-[var(--cyber-magenta)] shadow-lg shadow-[var(--cyber-magenta)]/30',
  },
  
  // Hover effects using CSS classes
  HOVER: {
    CYBER: 'hover-cyber',
    GLOW: 'hover-glow',
    LIFT: 'hover-lift',
    BRIGHTNESS: 'hover-brightness',
    SATURATE: 'hover-saturate',
    SUCCESS: 'hover-success',
    WARNING: 'hover-warning',
  },
  
  // Semantic state utilities
  SEMANTIC: {
    SUCCESS: 'semantic-success',
    WARNING: 'semantic-warning',
    ERROR: 'semantic-error',
    BG_SUCCESS: 'bg-semantic-success',
    BG_WARNING: 'bg-semantic-warning',
    BG_ERROR: 'bg-semantic-error',
    BORDER_SUCCESS: 'border-semantic-success',
    BORDER_WARNING: 'border-semantic-warning',
    BORDER_ERROR: 'border-semantic-error',
  },
  
  
  // Common component styles
  COMPONENT: {
    CARD: 'rounded-lg border border-[var(--cyber-cyan)] border-opacity-20 shadow-2xl p-6',
    INPUT: 'w-full px-4 py-3 rounded font-mono text-sm transition-colors duration-200',
    BUTTON: 'inline-flex items-center justify-center rounded border border-[var(--cyber-cyan)] border-opacity-30 text-[var(--cyber-cyan)] hover-cyber transition-all duration-200',
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
