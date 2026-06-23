// Join codes: 4 chars, unambiguous alphabet (no 0/O/1/I), uppercase.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateJoinCode(length = 4): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  let out = ''
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length]
  }
  return out
}

export function normalizeJoinCode(input: string): string {
  // The generation alphabet excludes O/I/0/1, so just uppercase and strip
  // anything that is not a letter or digit.
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 8)
}
