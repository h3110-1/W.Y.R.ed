import { useMemo, useState } from 'react'
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
  onClick,
}: {
  letter: Choice
  text: string
  selected: boolean
  dimmed: boolean
  onClick: () => void
}) {
  const bg = letter === 'A' ? 'bg-opta' : 'bg-optb'
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-1 flex-col items-center justify-center overflow-hidden rounded-3xl p-4 text-center transition-all duration-200 active:scale-[0.98] ${bg} ${
        selected ? 'shadow-2xl ring-4 ring-white' : ''
      } ${dimmed ? 'opacity-40 saturate-50' : ''}`}
    >
      <span className="absolute top-3 select-none text-6xl font-black leading-none text-white/20">
        {letter}
      </span>
      <span className="max-h-full break-words px-1 text-xl font-extrabold leading-tight text-white drop-shadow-md sm:text-2xl">
        {text}
      </span>
      {selected && (
        <span className="absolute bottom-3 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-bold text-bg shadow">
          ✓ Your pick
        </span>
      )}
    </button>
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

  const votes = question?.votes ?? []
  const myVote = votes.find((v) => v.player?.id === me.id)?.choice as Choice | undefined
  const votedIds = new Set(votes.map((v) => v.player?.id).filter(Boolean) as string[])
  const notVoted = players.filter((p) => !votedIds.has(p.id))

  async function vote(choice: Choice) {
    if (!question) return
    await castVote({ questionId: question.id, playerId: me.id, choice })
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
      </header>

      {/* The classic split: big red on the left, big blue on the right */}
      <div className="relative flex flex-1 items-stretch gap-2 p-2">
        <OptionSide
          letter="A"
          text={question.optionA}
          selected={myVote === 'A'}
          dimmed={myVote === 'B'}
          onClick={() => vote('A')}
        />
        <OptionSide
          letter="B"
          text={question.optionB}
          selected={myVote === 'B'}
          dimmed={myVote === 'A'}
          onClick={() => vote('B')}
        />
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-bg bg-surface text-sm font-black tracking-wide text-text shadow-xl">
            OR
          </div>
        </div>
      </div>

      <footer className="px-4 pb-1">
        <p className="pb-1 text-center text-xs text-muted">
          {notVoted.length === 0
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
