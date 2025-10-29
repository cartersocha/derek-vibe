import { sanitizeRichText } from './sanitize';

// Sanitize mention content to prevent XSS while preserving mention functionality
export function sanitizeMentionContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // First, sanitize the content using rich text sanitization
  // This allows basic formatting but removes dangerous content
  let sanitized = sanitizeRichText(content);

  // Preserve mention syntax (@mentions) but sanitize the content around them
  // This regex matches @mentions and preserves them
  const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
  
  // Extract all mentions before sanitization
  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[0]);
  }

  // Restore mentions after sanitization
  mentions.forEach(mention => {
    // Only restore if the mention is still valid (no dangerous content)
    const cleanMention = mention.replace(/[<>\"'&]/g, '');
    if (cleanMention === mention) {
      sanitized = sanitized.replace(mentionRegex, mention);
    }
  });

  return sanitized;
}

// Validate mention targets to ensure they're safe
export function validateMentionTarget(target: string): boolean {
  if (!target || typeof target !== 'string') {
    return false;
  }

  // Check for dangerous patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<link/i,
    /<meta/i,
    /<style/i,
  ];

  return !dangerousPatterns.some(pattern => pattern.test(target));
}

// Sanitize mention targets (character names, group names, etc.)
export function sanitizeMentionTarget(target: string): string {
  if (!target || typeof target !== 'string') {
    return '';
  }

  // Remove any HTML tags and dangerous content
  const sanitized = target
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/vbscript:/gi, '') // Remove vbscript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();

  // Limit length to prevent abuse
  return sanitized.length > 100 ? sanitized.substring(0, 100) : sanitized;
}

// Validate mention query (what user types after @)
export function validateMentionQuery(query: string): boolean {
  if (!query || typeof query !== 'string') {
    return false;
  }

  // Check for dangerous patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<link/i,
    /<meta/i,
    /<style/i,
  ];

  // Check length
  if (query.length > 50) {
    return false;
  }

  return !dangerousPatterns.some(pattern => pattern.test(query));
}

// Sanitize mention query
export function sanitizeMentionQuery(query: string): string {
  if (!query || typeof query !== 'string') {
    return '';
  }

  // Remove dangerous content
  const sanitized = query
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/vbscript:/gi, '') // Remove vbscript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();

  // Limit length
  return sanitized.length > 50 ? sanitized.substring(0, 50) : sanitized;
}

// Validate mention boundaries (spaces, newlines, etc.)
export function isValidMentionBoundary(char: string): boolean {
  if (!char || typeof char !== 'string') {
    return false;
  }

  // Allow spaces, newlines, tabs, and common punctuation
  return /[\s\n\r\t.,!?;:'")\]]/.test(char);
}

// Sanitize mention display text
export function sanitizeMentionDisplay(display: string): string {
  if (!display || typeof display !== 'string') {
    return '';
  }

  // Remove HTML tags and dangerous content
  const sanitized = display
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/vbscript:/gi, '') // Remove vbscript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();

  // Limit length
  return sanitized.length > 100 ? sanitized.substring(0, 100) : sanitized;
}
