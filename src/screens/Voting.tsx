import { useMemo, useState } from 'react'
import { Button, Card, Pill, Screen } from '../components/ui'
import { TimerBar } from '../components/TimerBar'
import {
  advancePhase,
  castVote,
  type GameRow,
  type PlayerRow,
  type QuestionRow,
} from '../lib/gameActions'
import type { Choice } from '../types'

// Full static class strings per letter so Tailwind's scanner keeps them.
const OPTION_STYLES = {
  A: {
    text: 'text-a',
    selected: 'border-a bg-a/15 ring-2 ring-a',
  },
  B: {
    text: 'text-b',
    selected: 'border-b bg-b/15 ring-2 ring-b',
  },
} as const

function OptionButton({
  letter,
  text,
  selected,
  onClick,
}: {
  letter: Choice
  text: string
  selected: boolean
  onClick: () => void
}) {
  const s = OPTION_STYLES[letter]
  return (
    <button
      onClick={onClick}
      className={`relative w-full rounded-2xl border p-5 text-left transition active:scale-[0.99] ${
        selected ? s.selected : 'border-border bg-surface'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`text-2xl font-black ${s.text}`}>{letter}</span>
        <span className="pt-0.5 text-lg font-semibold leading-snug">{text}</span>
      </div>
      {selected && <span className={`absolute right-3 top-3 ${s.text}`}>✓</span>}
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
    <Screen>
      <div className="flex items-center justify-between">
        <Pill>
          Question {game.currentIndex + 1} of {total}
        </Pill>
        <Pill tone={notVoted.length === 0 ? 'good' : 'default'}>
          {votedIds.size}/{players.length} voted
        </Pill>
      </div>

      <TimerBar endsAt={game.phaseEndsAt} totalSeconds={game.settings.voteSeconds} />

      {game.settings.showCreator && (
        <p className="text-center text-xs text-muted">
          written by {question.creator?.username ?? '—'}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <OptionButton
          letter="A"
          text={question.optionA}
          selected={myVote === 'A'}
          onClick={() => vote('A')}
        />
        <div className="text-center text-xs font-bold uppercase tracking-widest text-muted">
          or
        </div>
        <OptionButton
          letter="B"
          text={question.optionB}
          selected={myVote === 'B'}
          onClick={() => vote('B')}
        />
      </div>

      <p className="text-center text-xs text-muted">
        {myVote ? 'You can change your pick until the timer ends.' : 'Tap your pick.'}
      </p>

      {/* Still to vote */}
      <Card>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">
          {notVoted.length === 0 ? 'Everyone has voted' : 'Still to vote'}
        </h2>
        <div className="flex flex-wrap gap-2">
          {notVoted.length === 0 ? (
            <span className="text-sm text-good">Waiting for the timer…</span>
          ) : (
            notVoted.map((p) => (
              <span
                key={p.id}
                className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs"
              >
                {p.username}
                {p.id === me.id ? ' (you)' : ''}
              </span>
            ))
          )}
        </div>
      </Card>

      <HostSkip show={me.isHost} label="Skip to results" busy={skipping} onClick={skip} />
    </Screen>
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
    <div className="sticky bottom-0 -mx-4 mt-2 bg-gradient-to-t from-bg via-bg to-transparent px-4 pb-3 pt-4">
      <Button variant="secondary" full onClick={onClick} disabled={busy}>
        {busy ? 'Skipping…' : label} ⏭
      </Button>
    </div>
  )
}
