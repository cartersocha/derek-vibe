import sanitizeHtml from "sanitize-html";

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
  allowProtocolRelative: false,
  allowedSchemes: ["http", "https", "mailto"],
};

const AMP_ENTITY_REGEX = /&amp;(?![a-zA-Z0-9]+;)/g;

export function sanitizeText(value: string): string {
  const sanitized = sanitizeHtml(value, SANITIZE_OPTIONS);

  if (!sanitized.includes("&amp;")) {
    return sanitized;
  }

  return sanitized.replace(AMP_ENTITY_REGEX, "&");
}

export function sanitizeNullableText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const sanitized = sanitizeText(value);
  const trimmed = sanitized.trim();

  return trimmed.length > 0 ? trimmed : null;
}
