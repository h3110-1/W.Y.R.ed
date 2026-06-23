import { useEffect, useState } from 'react'

// A ticking "now" in epoch ms. Drives countdowns. Default 250ms for smooth
// second changes without being wasteful.
export function useNow(intervalMs = 250): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

export function secondsLeft(endsAt: number | null | undefined, now: number): number {
  if (!endsAt) return 0
  return Math.max(0, Math.ceil((endsAt - now) / 1000))
}
