import { useMemo, useState } from 'react'
import { Card, Pill, Screen } from '../components/ui'
import { TimerBar } from '../components/TimerBar'
import { HostSkip } from './Voting'
import {
  advancePhase,
  type GameRow,
  type PlayerRow,
  type QuestionRow,
  type VoteRow,
} from '../lib/gameActions'

const RESULT_STYLES = {
  A: { bar: 'bg-a', text: 'text-a', chip: 'border-a/40 bg-a/10 text-a' },
  B: { bar: 'bg-b', text: 'text-b', chip: 'border-b/40 bg-b/10 text-b' },
} as const

function ResultRow({
  letter,
  text,
  count,
  pct,
  winner,
  voters,
  showVoters,
}: {
  letter: 'A' | 'B'
  text: string
  count: number
  pct: number
  winner: boolean
  voters: string[]
  showVoters: boolean
}) {
  const s = RESULT_STYLES[letter]
  return (
    <div className={`rounded-2xl border p-4 ${winner ? `border-2 ${s.text}` : 'border-border'}`}>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`text-xl font-black ${s.text}`}>{letter}</span>
          <span className="font-semibold leading-snug">{text}</span>
        </div>
        <span className={`shrink-0 text-lg font-black tabular-nums ${s.text}`}>{pct}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-surface-2">
        <div
          className={`h-full rounded-full ${s.bar} transition-[width] duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-muted">
          {count} vote{count === 1 ? '' : 's'}
        </span>
        {winner && count > 0 && <Pill tone={letter === 'A' ? 'a' : 'b'}>winner</Pill>}
      </div>
      {showVoters && voters.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {voters.map((name) => (
            <span
              key={name}
              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${s.chip}`}
            >
              {name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function Reveal({
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
  const isLast = game.currentIndex + 1 >= total
  const qid = game.questionOrder[game.currentIndex]
  const question = useMemo(() => questions.find((q) => q.id === qid), [questions, qid])
  const [skipping, setSkipping] = useState(false)

  const votes: VoteRow[] = question?.votes ?? []
  const aVotes = votes.filter((v) => v.choice === 'A')
  const bVotes = votes.filter((v) => v.choice === 'B')
  const cast = aVotes.length + bVotes.length
  const aPct = cast === 0 ? 0 : Math.round((aVotes.length / cast) * 100)
  const bPct = cast === 0 ? 0 : 100 - aPct
  const tie = aVotes.length === bVotes.length

  const namesOf = (vs: VoteRow[]) =>
    vs.map((v) => v.player?.username ?? '—').sort((a, b) => a.localeCompare(b))

  const nonVoters = useMemo(() => {
    const voted = new Set(votes.map((v) => v.player?.id).filter(Boolean) as string[])
    return players.filter((p) => !voted.has(p.id)).map((p) => p.username)
  }, [players, votes])

  async function next() {
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
        <p className="py-20 text-center text-sm text-muted">Loading results…</p>
      </Screen>
    )
  }

  return (
    <Screen>
      <div className="flex items-center justify-between">
        <Pill>
          Question {game.currentIndex + 1} of {total}
        </Pill>
        <Pill tone="good">results</Pill>
      </div>

      <TimerBar endsAt={game.phaseEndsAt} totalSeconds={game.settings.revealSeconds} />

      {game.settings.showCreator && (
        <p className="text-center text-xs text-muted">
          written by {question.creator?.username ?? '—'}
        </p>
      )}

      {tie && cast > 0 && (
        <p className="text-center text-sm font-bold text-warn">It's a tie!</p>
      )}

      <div className="flex flex-col gap-3">
        <ResultRow
          letter="A"
          text={question.optionA}
          count={aVotes.length}
          pct={aPct}
          winner={!tie && aVotes.length > bVotes.length}
          voters={namesOf(aVotes)}
          showVoters={game.settings.showVoters}
        />
        <ResultRow
          letter="B"
          text={question.optionB}
          count={bVotes.length}
          pct={bPct}
          winner={!tie && bVotes.length > aVotes.length}
          voters={namesOf(bVotes)}
          showVoters={game.settings.showVoters}
        />
      </div>

      {game.settings.showVoters && nonVoters.length > 0 && (
        <Card>
          <span className="text-xs text-muted">Didn't vote: {nonVoters.join(', ')}</span>
        </Card>
      )}

      <HostSkip
        show={me.isHost}
        label={isLast ? 'Finish game' : 'Next question'}
        busy={skipping}
        onClick={next}
      />
    </Screen>
  )
}
