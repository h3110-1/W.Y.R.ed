import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Pill, Screen } from '../components/ui'
import { TimerBar } from '../components/TimerBar'
import {
  advancePhase,
  castVote,
  type GameRow,
  type PlayerRow,
  type QuestionRow,
} from '../lib/gameActions'
import type { Choice } from '../types'

// One big side of the classic split. A = red (left), B = blue (right).
function OptionSide({
  letter,
  text,
  selected,
  dimmed,
  locked,
  onClick,
}: {
  letter: Choice
  text: string
  selected: boolean
  dimmed: boolean
  locked: boolean
  onClick: () => void
}) {
  const bg = letter === 'A' ? 'bg-opta' : 'bg-optb'
  return (
    <button
      onClick={onClick}
      disabled={locked}
      className={`relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-3xl p-4 text-center transition-all duration-200 ${
        locked ? 'cursor-default' : 'active:scale-[0.98]'
      } ${bg} ${selected ? 'shadow-2xl ring-4 ring-white' : ''} ${
        dimmed ? 'opacity-40 saturate-50' : ''
      }`}
    >
      <span className="absolute top-3 select-none text-6xl font-black leading-none text-white/20">
        {letter}
      </span>
      <span className="max-h-full break-words px-1 text-xl font-extrabold leading-tight text-white drop-shadow-md sm:text-2xl">
        {text}
      </span>
      {selected && (
        <span className="absolute bottom-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-bg shadow">
          ✓ Locked in
        </span>
      )}
    </button>
  )
}

// Smoothly swell a bar segment (~60% taller, eased) when a vote lands on it.
function pulseSegment(el: HTMLElement | null) {
  if (!el) return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  el.animate(
    [
      { transform: 'scaleY(1)' },
      { transform: 'scaleY(1.65)', offset: 0.45 },
      { transform: 'scaleY(1)' },
    ],
    { duration: 750, easing: 'ease-in-out' },
  )
}

// Live, anonymous vote tally shown once you've locked your own pick. The
// leading colour burns with a flickering fire-like glow, and each side swells
// briefly when a new vote arrives for it.
function LiveTally({ aCount, bCount }: { aCount: number; bCount: number }) {
  const cast = aCount + bCount
  const aPct = cast === 0 ? 50 : Math.round((aCount / cast) * 100)
  const bPct = 100 - aPct
  const leading: 'A' | 'B' | 'tie' =
    aCount > bCount ? 'A' : bCount > aCount ? 'B' : 'tie'

  const aRef = useRef<HTMLDivElement>(null)
  const bRef = useRef<HTMLDivElement>(null)
  const prev = useRef({ a: aCount, b: bCount })
  useEffect(() => {
    if (aCount > prev.current.a) pulseSegment(aRef.current)
    if (bCount > prev.current.b) pulseSegment(bRef.current)
    prev.current = { a: aCount, b: bCount }
  }, [aCount, bCount])

  return (
    <div className="animate-pop">
      <div className="mb-1 flex items-center justify-between text-xs font-bold">
        <span className="text-opta">{aPct}%</span>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-good" />
          live
        </span>
        <span className="text-optb">{bPct}%</span>
      </div>
      <div className="relative h-4 rounded-full bg-surface-2">
        {/* A grows from the left, B from the right; they meet at the frontier */}
        <div
          ref={aRef}
          className={`absolute left-0 top-0 h-full overflow-hidden rounded-l-full rounded-r-sm bg-opta transition-[width] duration-500 ease-out ${
            leading === 'A' ? 'fire-a z-10' : ''
          }`}
          style={{ width: `${aPct}%` }}
        >
          {leading === 'A' && <div className="heat-sheen absolute inset-y-0 w-1/3" />}
        </div>
        <div
          ref={bRef}
          className={`absolute right-0 top-0 h-full overflow-hidden rounded-r-full rounded-l-sm bg-optb transition-[width] duration-500 ease-out ${
            leading === 'B' ? 'fire-b z-10' : ''
          }`}
          style={{ width: `${bPct}%` }}
        >
          {leading === 'B' && <div className="heat-sheen absolute inset-y-0 w-1/3" />}
        </div>
      </div>
    </div>
  )
}

export function Voting({
  game,
  players,
  questions,
  me,
}: {
  game: GameRow
  players: PlayerRow[]
  questions: QuestionRow[]
  me: PlayerRow
  isHost: boolean
}) {
  const total = game.questionOrder.length
  const qid = game.questionOrder[game.currentIndex]
  const question = useMemo(() => questions.find((q) => q.id === qid), [questions, qid])
  const [skipping, setSkipping] = useState(false)
  // Locks the choice the instant it's tapped, before the server confirms, so a
  // fast second tap can't change it. Reset for each new question.
  const [pendingChoice, setPendingChoice] = useState<Choice | null>(null)
  useEffect(() => setPendingChoice(null), [qid])

  const votes = question?.votes ?? []
  const serverVote = votes.find((v) => v.player?.id === me.id)?.choice as Choice | undefined
  const myVote = serverVote ?? pendingChoice ?? undefined
  const locked = myVote !== undefined
  const votedIds = new Set(votes.map((v) => v.player?.id).filter(Boolean) as string[])
  const notVoted = players.filter((p) => !votedIds.has(p.id))
  const aCount = votes.filter((v) => v.choice === 'A').length
  const bCount = votes.filter((v) => v.choice === 'B').length

  async function vote(choice: Choice) {
    // Votes are final: ignore taps once a choice is locked in.
    if (!question || locked) return
    setPendingChoice(choice)
    try {
      await castVote({ questionId: question.id, playerId: me.id, choice })
    } catch {
      setPendingChoice(null) // let them try again if the write failed
    }
  }

  async function skip() {
    setSkipping(true)
    try {
      await advancePhase(game)
    } catch {
      setSkipping(false)
    }
  }

  if (!question) {
    return (
      <Screen>
        <p className="py-20 text-center text-sm text-muted">Loading question…</p>
      </Screen>
    )
  }

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col">
      <header className="px-4 pt-3">
        <div className="flex items-center justify-between">
          <Pill>
            Question {game.currentIndex + 1} of {total}
          </Pill>
          <Pill tone={notVoted.length === 0 ? 'good' : 'default'}>
            {votedIds.size}/{players.length} voted
          </Pill>
        </div>
        <div className="mt-3">
          <TimerBar endsAt={game.phaseEndsAt} totalSeconds={game.settings.voteSeconds} />
        </div>
        {game.settings.showCreator && (
          <p className="mt-2 text-center text-xs text-muted">
            written by {question.creator?.username ?? '—'}
          </p>
        )}
        {/* Live results unlock once you've voted */}
        {locked && (
          <div className="mt-3">
            <LiveTally aCount={aCount} bCount={bCount} />
          </div>
        )}
      </header>

      {/* The classic split: big red on the left, big blue on the right */}
      <div className="relative flex flex-1 items-stretch gap-2 p-2">
        <OptionSide
          letter="A"
          text={question.optionA}
          selected={myVote === 'A'}
          dimmed={myVote === 'B'}
          locked={locked}
          onClick={() => vote('A')}
        />
        <OptionSide
          letter="B"
          text={question.optionB}
          selected={myVote === 'B'}
          dimmed={myVote === 'A'}
          locked={locked}
          onClick={() => vote('B')}
        />
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-bg bg-surface text-sm font-black tracking-wide text-text shadow-xl">
            OR
          </div>
        </div>
      </div>

      <footer className="px-4 pb-1">
        <p
          className={`pb-1 text-center text-xs ${
            locked ? 'text-muted' : 'font-semibold text-warn'
          }`}
        >
          {!locked
            ? "Choose carefully — you can't change your answer."
            : notVoted.length === 0
              ? 'Everyone has voted — waiting for the timer…'
              : `Still to vote: ${notVoted
                  .map((p) => (p.id === me.id ? 'you' : p.username))
                  .join(', ')}`}
        </p>
        <HostSkip show={me.isHost} label="Skip to results" busy={skipping} onClick={skip} />
      </footer>
    </div>
  )
}

export function HostSkip({
  show,
  label,
  busy,
  onClick,
}: {
  show: boolean
  label: string
  busy: boolean
  onClick: () => void
}) {
  if (!show) return null
  return (
    <div className="sticky bottom-0 -mx-4 mt-1 bg-gradient-to-t from-bg via-bg to-transparent px-4 pb-3 pt-4">
      <Button variant="secondary" full onClick={onClick} disabled={busy}>
        {busy ? 'Skipping…' : label} ⏭
      </Button>
    </div>
  )
}
