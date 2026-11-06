/**
 * User-approved AI Coach memories.
 * These are short preferences the user saved on purpose — not chat history,
 * journal text, or instructions that can override safety rules.
 */

export const COACH_MEMORY_MAX_ITEMS = 15;
export const COACH_MEMORY_MAX_CHARS = 120;

const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const SECRET_RE = /password|api[_\s-]?key|\bsk-[a-z0-9]/i;

export function collapseMemoryText(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
}

export function rejectionReasonForMemoryText(value) {
  const collapsed = collapseMemoryText(value);
  if (!collapsed) return 'Enter a short preference to remember.';
  if (collapsed.length > COACH_MEMORY_MAX_CHARS) {
    return 'Keep a memory to 120 characters or fewer.';
  }
  if (EMAIL_RE.test(collapsed)) return 'Memories cannot include an email address.';
  if (SECRET_RE.test(collapsed)) return 'Memories cannot include passwords or API keys.';
  return null;
}

/** Returns a single-line preference, or null when it is not safe to store. */
export function sanitizeCoachMemoryText(value) {
  if (rejectionReasonForMemoryText(value)) return null;
  return collapseMemoryText(value);
}

/**
 * Stored records keep id and createdAt. Unknown fields are dropped.
 * Duplicates, emails, secrets, and over-long text are removed.
 */
export function sanitizeStoredMemories(raw) {
  if (!Array.isArray(raw)) return [];

  const seen = new Set();
  const memories = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const text = sanitizeCoachMemoryText(item.text);
    if (!text) continue;

    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const id =
      typeof item.id === 'string' && item.id.trim()
        ? item.id.trim().replace(/\s+/g, '').slice(0, 80)
        : `memory-${memories.length + 1}`;
    const createdAt =
      typeof item.createdAt === 'string' && item.createdAt.trim()
        ? item.createdAt.trim().slice(0, 40)
        : new Date(0).toISOString();

    memories.push({ id, text, createdAt });
    if (memories.length >= COACH_MEMORY_MAX_ITEMS) break;
  }

  return memories;
}

/** API payload: text only, already sanitized. */
export function sanitizeCoachMemoryList(raw) {
  const stored = Array.isArray(raw)
    ? raw.map((item) =>
        typeof item === 'string' ? { text: item } : item
      )
    : [];

  return sanitizeStoredMemories(stored).map((memory) => ({ text: memory.text }));
}
