import { secondsLeft, useNow } from '../lib/time'

export function TimerBar({
  endsAt,
  totalSeconds,
  tone = 'brand',
}: {
  endsAt?: number | null
  totalSeconds: number
  tone?: 'brand' | 'a' | 'b'
}) {
  const now = useNow()
  const left = secondsLeft(endsAt, now)
  const pct = totalSeconds > 0 ? Math.min(100, Math.max(0, (left / totalSeconds) * 100)) : 0
  const urgent = left <= 5
  const colors: Record<string, string> = {
    brand: 'from-brand to-brand-2',
    a: 'from-a to-a',
    b: 'from-b to-b',
  }
  return (
    <div className="flex items-center gap-3">
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${
            urgent ? 'from-b to-b' : colors[tone]
          } transition-[width] duration-300 ease-linear`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`w-8 text-right text-sm font-bold tabular-nums ${
          urgent ? 'text-b' : 'text-text'
        }`}
      >
        {left}
      </span>
    </div>
  )
}
