import sanitizeHtml from "sanitize-html";

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
  allowProtocolRelative: false,
  allowedSchemes: ["http", "https", "mailto"],
};

export function sanitizeText(value: string): string {
  return sanitizeHtml(value, SANITIZE_OPTIONS);
}

export function sanitizeNullableText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const sanitized = sanitizeText(value);
  const trimmed = sanitized.trim();

  return trimmed.length > 0 ? trimmed : null;
}
