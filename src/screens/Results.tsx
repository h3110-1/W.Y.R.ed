import { useMemo, useState } from 'react'
import { Button, Card, Pill, Screen } from '../components/ui'
import {
  closeGame,
  type GameRow,
  type PlayerRow,
  type QuestionRow,
} from '../lib/gameActions'

interface Recap {
  question: QuestionRow
  a: number
  b: number
  aPct: number
  cast: number
  tie: boolean
}

export function Results({
  game,
  questions,
  isHost,
  onLeave,
}: {
  game: GameRow
  players: PlayerRow[]
  questions: QuestionRow[]
  me: PlayerRow
  isHost: boolean
  onLeave: () => void
}) {
  const [closing, setClosing] = useState(false)

  const recaps: Recap[] = useMemo(() => {
    return game.questionOrder
      .map((qid) => questions.find((q) => q.id === qid))
      .filter((q): q is QuestionRow => !!q)
      .map((q) => {
        const votes = q.votes ?? []
        const a = votes.filter((v) => v.choice === 'A').length
        const b = votes.filter((v) => v.choice === 'B').length
        const cast = a + b
        return {
          question: q,
          a,
          b,
          cast,
          aPct: cast === 0 ? 0 : Math.round((a / cast) * 100),
          tie: a === b,
        }
      })
  }, [game.questionOrder, questions])

  const mostDivisive = useMemo(() => {
    const withVotes = recaps.filter((r) => r.cast > 0)
    if (withVotes.length === 0) return null
    return withVotes.reduce((best, r) =>
      Math.abs(r.aPct - 50) < Math.abs(best.aPct - 50) ? r : best,
    )
  }, [recaps])

  async function close() {
    setClosing(true)
    try {
      await closeGame(game.id)
    } catch {
      setClosing(false)
      return
    }
    onLeave()
  }

  return (
    <Screen>
      <div className="flex-1 flex flex-col gap-4 py-4">
        <div className="text-center">
          <h1 className="text-3xl font-black">That's a wrap! 🎉</h1>
          <p className="mt-1 text-sm text-muted">
            {recaps.length} would-you-rather{recaps.length === 1 ? '' : 's'} played
          </p>
        </div>

        {mostDivisive && (
          <Card className="text-center">
            <Pill tone="warn">most divisive</Pill>
            <p className="mt-2 text-sm">
              <span className="font-semibold text-a">{mostDivisive.question.optionA}</span>
              <span className="px-1 text-muted">vs</span>
              <span className="font-semibold text-b">{mostDivisive.question.optionB}</span>
            </p>
            <p className="mt-1 text-xs text-muted">
              split {mostDivisive.aPct}% / {100 - mostDivisive.aPct}%
            </p>
          </Card>
        )}

        <Card>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Recap</h2>
          <div className="flex flex-col gap-3">
            {recaps.map((r, i) => (
              <div key={r.question.id} className="flex flex-col gap-1">
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-xs font-bold text-muted">{i + 1}.</span>
                  <span className="flex-1">
                    <span
                      className={r.a >= r.b ? 'font-bold text-a' : 'text-a/70'}
                    >
                      {r.question.optionA}
                    </span>
                    <span className="px-1 text-muted">vs</span>
                    <span
                      className={r.b > r.a ? 'font-bold text-b' : 'text-b/70'}
                    >
                      {r.question.optionB}
                    </span>
                  </span>
                </div>
                <div className="ml-5 flex h-2 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full bg-a" style={{ width: `${r.aPct}%` }} />
                  <div className="h-full bg-b" style={{ width: `${100 - r.aPct}%` }} />
                </div>
                <div className="ml-5 flex justify-between text-[11px] text-muted">
                  <span>
                    A {r.a} {game.settings.showCreator ? `· by ${r.question.creator?.username ?? '—'}` : ''}
                  </span>
                  <span>B {r.b}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 bg-gradient-to-t from-bg via-bg to-transparent px-4 pb-3 pt-4">
          {isHost ? (
            <>
              <Button full onClick={close} disabled={closing}>
                {closing ? 'Closing…' : 'Close game'}
              </Button>
              <p className="text-center text-xs text-muted">
                Closing removes the game for everyone.
              </p>
            </>
          ) : (
            <Button full variant="secondary" onClick={onLeave}>
              Leave
            </Button>
          )}
        </div>
      </div>
    </Screen>
  )
}
