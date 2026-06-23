import { useCallback, useEffect, useRef, useState } from 'react'
import { db } from '../db'

// The reactions players can fire off during a question.
const EMOJIS = ['🤮', '👍', '👎', '❓', '😂', '😱', '🔥', '❤️', '💀', '🤡'] as const

// How long after firing a reaction before this player can fire another.
const COOLDOWN_MS = 500

interface FloatingReaction {
  id: number
  emoji: string
  left: number // viewport-width %, where the emoji rises from
  dur: number // float duration (ms)
  drift: number // horizontal drift over the float (px)
  tilt: number // rotation (deg)
}

let nextId = 0

// A self-contained reaction layer: a bottom-right picker button + the floating
// emojis that everyone in the game sees pop up and drift across the screen.
export function Reactions({ gameId }: { gameId: string }) {
  const room = db.room('game', gameId)
  const publishReaction = db.rooms.usePublishTopic(room, 'reaction')

  const [open, setOpen] = useState(false)
  const [floats, setFloats] = useState<FloatingReaction[]>([])
  const [cooling, setCooling] = useState(false)
  const cooldownUntil = useRef(0)

  // Drop a floating emoji at a random spot; it removes itself when done.
  const spawn = useCallback((emoji: string) => {
    const id = nextId++
    const left = 6 + Math.random() * 82
    const dur = 2300 + Math.random() * 1400
    const drift = (Math.random() - 0.5) * 120
    const tilt = (Math.random() - 0.5) * 36
    setFloats((f) => [...f, { id, emoji, left, dur, drift, tilt }])
    window.setTimeout(() => {
      setFloats((f) => f.filter((x) => x.id !== id))
    }, dur + 100)
  }, [])

  // Reactions from other players (topics don't echo back to the sender).
  db.rooms.useTopicEffect(room, 'reaction', (event) => {
    spawn(event.emoji)
  })

  function react(emoji: string) {
    const now = Date.now()
    if (now < cooldownUntil.current) return // still cooling down
    cooldownUntil.current = now + COOLDOWN_MS
    setCooling(true)
    window.setTimeout(() => setCooling(false), COOLDOWN_MS)
    setOpen(false)
    publishReaction({ emoji })
    spawn(emoji) // instant local feedback for the sender
  }

  // Tap-away to close the menu.
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [open])

  return (
    <>
      {/* Floating emoji layer — fills the screen, ignores pointer events. */}
      <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
        {floats.map((f) => (
          <span
            key={f.id}
            className="reaction-float absolute bottom-24 select-none text-5xl drop-shadow-lg"
            style={
              {
                left: `${f.left}%`,
                '--dur': `${f.dur}ms`,
                '--drift': `${f.drift}px`,
                '--tilt': `${f.tilt}deg`,
              } as React.CSSProperties
            }
          >
            {f.emoji}
          </span>
        ))}
      </div>

      {/* Bottom-right picker. */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
        {open && (
          <div
            className="reaction-menu grid grid-cols-5 gap-1 rounded-2xl border border-border bg-surface/95 p-2 shadow-2xl backdrop-blur"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => react(emoji)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-2xl transition active:scale-90 hover:bg-surface-2"
                aria-label={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => setOpen((o) => !o)}
          disabled={cooling && !open}
          className={`flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface/95 text-2xl shadow-xl backdrop-blur transition active:scale-90 disabled:opacity-50 ${
            open ? 'ring-2 ring-brand' : ''
          }`}
          aria-label="Open reactions"
        >
          😀
        </button>
      </div>
    </>
  )
}
