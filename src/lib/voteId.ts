// Deterministic UUID (v4-shaped, valid for InstantDB) derived from a string.
// Used so a (question, player) pair always maps to the same vote record id,
// which makes re-voting an overwrite rather than an insert.

function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed
  let h2 = 0x41c6ce57 ^ seed
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507)
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507)
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

function hex32(n: number): string {
  // last 8 hex chars (32 bits) of the (unsigned) number
  return (n >>> 0).toString(16).padStart(8, '0')
}

function deterministicUuid(input: string): string {
  const raw =
    hex32(cyrb53(input, 1)) +
    hex32(cyrb53(input, 2)) +
    hex32(cyrb53(input + '#3', 3)) +
    hex32(cyrb53(input + '#4', 4))
  const chars = raw.slice(0, 32).split('')
  // force version 4
  chars[12] = '4'
  // force variant (8, 9, a, or b)
  chars[16] = ((parseInt(chars[16], 16) & 0x3) | 0x8).toString(16)
  const s = chars.join('')
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20, 32)}`
}

export function deterministicVoteId(questionId: string, playerId: string): string {
  return deterministicUuid(`vote:${questionId}:${playerId}`)
}
