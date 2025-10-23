import sanitizeHtml from "sanitize-html";

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
  allowProtocolRelative: false,
  allowedSchemes: ["http", "https", "mailto"],
};

const AMP_ENTITY_REGEX = /&amp;(?![a-zA-Z0-9]+;)/g;

// Enhanced sanitization options for different content types
const STRICT_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
  allowProtocolRelative: false,
  allowedSchemes: [],
  disallowedTagsMode: 'discard',
};

const RICH_TEXT_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ['p', 'br', 'strong', 'em', 'u', 'b', 'i'],
  allowedAttributes: {},
  allowProtocolRelative: false,
  allowedSchemes: [],
  disallowedTagsMode: 'discard',
};

// Maximum length limits for different input types
const MAX_LENGTHS = {
  name: 100,
  description: 2000,
  notes: 10000,
  backstory: 10000,
  location: 200,
  race: 50,
  class: 50,
  level: 20,
  role: 100,
  search: 200,
  password: 100,
  mentionQuery: 100,
} as const;

// Dangerous patterns to remove
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /onload\s*=/gi,
  /onerror\s*=/gi,
  /onclick\s*=/gi,
  /onmouseover\s*=/gi,
  /onfocus\s*=/gi,
  /onblur\s*=/gi,
  /onchange\s*=/gi,
  /onsubmit\s*=/gi,
  /onreset\s*=/gi,
  /onkeydown\s*=/gi,
  /onkeyup\s*=/gi,
  /onkeypress\s*=/gi,
  /onmousedown\s*=/gi,
  /onmouseup\s*=/gi,
  /onmouseover\s*=/gi,
  /onmouseout\s*=/gi,
  /onmousemove\s*=/gi,
  /onmouseenter\s*=/gi,
  /onmouseleave\s*=/gi,
  /oncontextmenu\s*=/gi,
  /ondblclick\s*=/gi,
  /onwheel\s*=/gi,
  /onresize\s*=/gi,
  /onscroll\s*=/gi,
  /onfocusin\s*=/gi,
  /onfocusout\s*=/gi,
  /oninput\s*=/gi,
  /oninvalid\s*=/gi,
  /onreset\s*=/gi,
  /onsearch\s*=/gi,
  /onselect\s*=/gi,
  /onsubmit\s*=/gi,
  /ontoggle\s*=/gi,
  /onbeforeunload\s*=/gi,
  /onhashchange\s*=/gi,
  /onmessage\s*=/gi,
  /onoffline\s*=/gi,
  /ononline\s*=/gi,
  /onpagehide\s*=/gi,
  /onpageshow\s*=/gi,
  /onpopstate\s*=/gi,
  /onstorage\s*=/gi,
  /onunload\s*=/gi,
];

export function sanitizeText(value: string): string {
  if (typeof value !== 'string') {
    return '';
  }

  // Remove dangerous patterns first
  let sanitized = value;
  DANGEROUS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Apply HTML sanitization
  sanitized = sanitizeHtml(sanitized, SANITIZE_OPTIONS);

  // Fix ampersand entities
  if (sanitized.includes("&amp;")) {
    sanitized = sanitized.replace(AMP_ENTITY_REGEX, "&");
  }

  return sanitized;
}

export function sanitizeStrictText(value: string): string {
  if (typeof value !== 'string') {
    return '';
  }

  // Remove dangerous patterns first
  let sanitized = value;
  DANGEROUS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Apply strict HTML sanitization
  sanitized = sanitizeHtml(sanitized, STRICT_SANITIZE_OPTIONS);

  // Fix ampersand entities
  if (sanitized.includes("&amp;")) {
    sanitized = sanitized.replace(AMP_ENTITY_REGEX, "&");
  }

  return sanitized;
}

export function sanitizeRichText(value: string): string {
  if (typeof value !== 'string') {
    return '';
  }

  // Remove dangerous patterns first
  let sanitized = value;
  DANGEROUS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Apply rich text sanitization
  sanitized = sanitizeHtml(sanitized, RICH_TEXT_SANITIZE_OPTIONS);

  // Fix ampersand entities
  if (sanitized.includes("&amp;")) {
    sanitized = sanitized.replace(AMP_ENTITY_REGEX, "&");
  }

  return sanitized;
}

export function sanitizeNullableText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const sanitized = sanitizeText(value);
  const trimmed = sanitized.trim();

  return trimmed.length > 0 ? trimmed : null;
}

export function sanitizeWithLengthLimit(
  value: string, 
  maxLength: number, 
  strict: boolean = false
): string {
  const sanitizer = strict ? sanitizeStrictText : sanitizeText;
  const sanitized = sanitizer(value);
  
  if (sanitized.length > maxLength) {
    return sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

export function sanitizeName(value: string): string {
  return sanitizeWithLengthLimit(value, MAX_LENGTHS.name, true);
}

export function sanitizeDescription(value: string): string {
  return sanitizeWithLengthLimit(value, MAX_LENGTHS.description, true);
}

export function sanitizeNotes(value: string): string {
  return sanitizeWithLengthLimit(value, MAX_LENGTHS.notes, false);
}

export function sanitizeBackstory(value: string): string {
  return sanitizeWithLengthLimit(value, MAX_LENGTHS.backstory, false);
}

export function sanitizeLocation(value: string): string {
  return sanitizeWithLengthLimit(value, MAX_LENGTHS.location, true);
}

export function sanitizeRace(value: string): string {
  return sanitizeWithLengthLimit(value, MAX_LENGTHS.race, true);
}

export function sanitizeClass(value: string): string {
  return sanitizeWithLengthLimit(value, MAX_LENGTHS.class, true);
}

export function sanitizeLevel(value: string): string {
  return sanitizeWithLengthLimit(value, MAX_LENGTHS.level, true);
}

export function sanitizeRole(value: string): string {
  return sanitizeWithLengthLimit(value, MAX_LENGTHS.role, true);
}

export function sanitizeSearchQuery(value: string): string {
  return sanitizeWithLengthLimit(value, MAX_LENGTHS.search, true);
}

export function sanitizePassword(value: string): string {
  return sanitizeWithLengthLimit(value, MAX_LENGTHS.password, true);
}

export function sanitizeMentionQuery(value: string): string {
  return sanitizeWithLengthLimit(value, MAX_LENGTHS.mentionQuery, true);
}

// Validation functions
export function isValidName(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const sanitized = sanitizeName(value);
  return sanitized.length > 0 && sanitized.length <= MAX_LENGTHS.name;
}

export function isValidDescription(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const sanitized = sanitizeDescription(value);
  return sanitized.length <= MAX_LENGTHS.description;
}

export function isValidNotes(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const sanitized = sanitizeNotes(value);
  return sanitized.length <= MAX_LENGTHS.notes;
}

export function isValidBackstory(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const sanitized = sanitizeBackstory(value);
  return sanitized.length <= MAX_LENGTHS.backstory;
}

export function isValidLocation(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const sanitized = sanitizeLocation(value);
  return sanitized.length <= MAX_LENGTHS.location;
}

export function isValidRace(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const sanitized = sanitizeRace(value);
  return sanitized.length <= MAX_LENGTHS.race;
}

export function isValidClass(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const sanitized = sanitizeClass(value);
  return sanitized.length <= MAX_LENGTHS.class;
}

export function isValidLevel(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const sanitized = sanitizeLevel(value);
  return sanitized.length <= MAX_LENGTHS.level;
}

export function isValidRole(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const sanitized = sanitizeRole(value);
  return sanitized.length <= MAX_LENGTHS.role;
}

export function isValidSearchQuery(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const sanitized = sanitizeSearchQuery(value);
  return sanitized.length <= MAX_LENGTHS.search;
}

export function isValidPassword(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const sanitized = sanitizePassword(value);
  return sanitized.length <= MAX_LENGTHS.password;
}

export function isValidMentionQuery(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const sanitized = sanitizeMentionQuery(value);
  return sanitized.length <= MAX_LENGTHS.mentionQuery;
}
