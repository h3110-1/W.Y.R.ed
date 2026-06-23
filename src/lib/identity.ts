// Per-device identity + last-session persistence so a refresh rejoins the same
// game as the same player (no duplicate player records).

const DEVICE_KEY = 'wyred.deviceToken'
const SESSION_KEY = 'wyred.session'

function randomToken(): string {
  if (crypto?.randomUUID) return crypto.randomUUID()
  // fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function getDeviceToken(): string {
  let token = localStorage.getItem(DEVICE_KEY)
  if (!token) {
    token = randomToken()
    localStorage.setItem(DEVICE_KEY, token)
  }
  return token
}

export interface Session {
  gameId: string
  playerId: string
  joinCode: string
}

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && parsed.gameId && parsed.playerId && parsed.joinCode) {
      return parsed as Session
    }
    return null
  } catch {
    return null
  }
}

export function saveSession(session: Session): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}
