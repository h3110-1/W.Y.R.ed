import { useEffect, useRef } from 'react'
import { db } from '../db'
import type { Session } from '../lib/identity'
import { advancePhase, type GameRow, type PlayerRow, type QuestionRow } from '../lib/gameActions'
import { Button, Logo, Screen } from '../components/ui'
import { Lobby } from './Lobby'
import { Voting } from './Voting'
import { Reveal } from './Reveal'
import { Results } from './Results'

// Only the host's device drives phase transitions when a timer expires.
function useHostClock(game: GameRow | undefined, isHost: boolean) {
  const firing = useRef(false)
  const endsAt = game?.phaseEndsAt ?? null
  const phase = game?.phase
  useEffect(() => {
    if (!game || !isHost) return
    if (phase !== 'voting' && phase !== 'reveal') return
    if (!endsAt) return
    firing.current = false
    const interval = setInterval(async () => {
      if (firing.current) return
      if (Date.now() >= endsAt) {
        firing.current = true
        try {
          await advancePhase(game)
        } catch {
          firing.current = false
        }
      }
    }, 300)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.id, phase, endsAt, isHost])
}

function CenterMessage({
  title,
  body,
  onLeave,
}: {
  title: string
  body: string
  onLeave: () => void
}) {
  return (
    <Screen>
      <div className="flex-1 flex flex-col justify-center gap-6 py-10">
        <Logo />
        <div className="text-center">
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="mt-2 text-sm text-muted">{body}</p>
        </div>
        <Button full onClick={onLeave}>
          Back to start
        </Button>
      </div>
    </Screen>
  )
}

export function GameContainer({
  session,
  onLeave,
}: {
  session: Session
  onLeave: () => void
}) {
  const { isLoading, error, data } = db.useQuery({
    games: {
      $: { where: { id: session.gameId } },
      players: {},
      questions: { creator: {}, votes: { player: {} } },
    },
  })

  const rawGame = data?.games?.[0]
  const game = rawGame as unknown as GameRow | undefined
  const players = ((rawGame?.players ?? []) as unknown as PlayerRow[])
    .slice()
    .sort((a, b) => a.joinedAt - b.joinedAt)
  const questions = ((rawGame?.questions ?? []) as unknown as QuestionRow[])
    .slice()
    .sort((a, b) => a.createdAt - b.createdAt)
  const me = players.find((p) => p.id === session.playerId)
  const isHost = !!me?.isHost

  useHostClock(game, isHost)

  if (isLoading) {
    return (
      <Screen>
        <div className="flex-1 flex items-center justify-center py-20">
          <p className="text-sm text-muted">Loading…</p>
        </div>
      </Screen>
    )
  }

  if (error) {
    return (
      <CenterMessage
        title="Something went wrong"
        body="We lost the connection to this game."
        onLeave={onLeave}
      />
    )
  }

  if (!game) {
    return (
      <CenterMessage
        title="Game ended"
        body="This game no longer exists. The host may have closed it."
        onLeave={onLeave}
      />
    )
  }

  if (!me) {
    return (
      <CenterMessage
        title="You're no longer in this game"
        body="The host removed you, or the game was reset."
        onLeave={onLeave}
      />
    )
  }

  if (game.phase === 'lobby') {
    return (
      <Lobby
        game={game}
        players={players}
        questions={questions}
        me={me}
        isHost={isHost}
        onLeave={onLeave}
      />
    )
  }

  if (game.phase === 'voting') {
    return (
      <Voting game={game} players={players} questions={questions} me={me} isHost={isHost} />
    )
  }

  if (game.phase === 'reveal') {
    return (
      <Reveal game={game} players={players} questions={questions} me={me} isHost={isHost} />
    )
  }

  return (
    <Results
      game={game}
      players={players}
      questions={questions}
      me={me}
      isHost={isHost}
      onLeave={onLeave}
    />
  )
}
