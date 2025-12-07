export function toSnakeCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_') // Replace all non-alphanumeric groups with `_`
    .replace(/^_+|_+$/g, ''); // Trim leading/trailing underscores
}

/** normalize phone number US */
export function normalizePhoneNumber(raw: string): string {
  const cleaned = raw.replace(/\D/g, '');

  return cleaned.startsWith('1') ? cleaned.slice(1) : cleaned;
}
