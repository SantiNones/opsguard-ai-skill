export function normalizeMissingFields(fields: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const field of fields) {
    const cleaned = cleanMissingField(field);
    if (!cleaned) continue;

    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    normalized.push(cleaned);
  }

  return normalized;
}

function cleanMissingField(field: string): string {
  const cleaned = field
    .trim()
    .replace(/^(missing|need|provide|requires)\s+/i, '')
    .replace(/\s+/g, ' ');

  if (!cleaned) return '';

  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
