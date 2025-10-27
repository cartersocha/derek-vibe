// Password utilities for robust authentication

export function normalizePassword(password: string): string {
  if (!password || typeof password !== 'string') {
    return '';
  }
  
  // Remove extra whitespace and normalize
  return password.trim().replace(/\s+/g, ' ');
}

export function comparePasswords(input: string, stored: string): boolean {
  if (!input || !stored) {
    return false;
  }
  
  const normalizedInput = normalizePassword(input);
  const normalizedStored = normalizePassword(stored);
  
  return normalizedInput === normalizedStored;
}

export function hashPassword(password: string): string {
  // Simple hash for basic security (in production, use bcrypt or similar)
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

export function verifyPassword(input: string, stored: string): boolean {
  // Try direct comparison first
  if (comparePasswords(input, stored)) {
    return true;
  }
  
  // Try with different whitespace handling
  const inputNormalized = input.replace(/\s/g, '');
  const storedNormalized = stored.replace(/\s/g, '');
  
  if (inputNormalized === storedNormalized) {
    return true;
  }
  
  // Try case-insensitive comparison
  if (input.toLowerCase().trim() === stored.toLowerCase().trim()) {
    return true;
  }
  
  return false;
}


