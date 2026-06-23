// SHA-256 of the creator code. Only the hash ships in the bundle — never the
// plaintext. This is a soft gate to keep randoms from spinning up games, not a
// hard security boundary (the hash is visible in the bundle and could be brute
// forced offline). See instant.perms.ts for the broader security tradeoff.
const CREATOR_CODE_HASH =
  '69bf852c71c55b851fb20afc65bcb19078223049b86a146a845a2ab80a2ee0b2'

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function isValidCreatorCode(code: string): Promise<boolean> {
  if (!code) return false
  const hash = await sha256Hex(code)
  // length is constant so this comparison does not leak via timing in any
  // meaningful way for this threat model
  return hash === CREATOR_CODE_HASH
}
