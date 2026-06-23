import { useMemo, useState } from 'react'
import { db } from '../db'
import { Button, Card, ErrorText, Input, Label, Logo, Screen } from '../components/ui'
import { normalizeJoinCode } from '../lib/codes'
import { getDeviceToken } from '../lib/identity'
import { joinGame } from '../lib/gameActions'
import { MAX_USERNAME } from '../types'
import type { Session } from '../lib/identity'

export function Join({
  initialCode,
  onJoined,
  onBack,
}: {
  initialCode?: string
  onJoined: (s: Session) => void
  onBack: () => void
}) {
  const [code, setCode] = useState(() =>
    initialCode ? normalizeJoinCode(initialCode) : '',
  )
  const [queryCode, setQueryCode] = useState<string | null>(() =>
    initialCode ? normalizeJoinCode(initialCode) : null,
  )
  const [username, setUsername] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  const { data, isLoading } = db.useQuery(
    queryCode ? { games: { $: { where: { joinCode: queryCode } }, players: {} } } : null,
  )

  const game = data?.games?.[0]
  const lookupResolved = !!queryCode && !isLoading
  const notFound = lookupResolved && !game
  const alreadyStarted = !!game && game.status !== 'lobby'
  const canPickName = !!game && game.status === 'lobby'

  const takenNames = useMemo(
    () => new Set((game?.players ?? []).map((p) => p.username.trim().toLowerCase())),
    [game],
  )

  function findGame(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const c = normalizeJoinCode(code)
    if (c.length < 4) {
      setError('Enter the 4-character game code.')
      return
    }
    setQueryCode(c)
  }

  async function doJoin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!game) return
    const name = username.trim()
    if (!name) {
      setError('Pick a username.')
      return
    }
    if (takenNames.has(name.toLowerCase())) {
      setError('That name is taken in this game. Pick another.')
      return
    }
    setJoining(true)
    try {
      const playerId = await joinGame({
        gameId: game.id,
        username: name,
        deviceToken: getDeviceToken(),
      })
      onJoined({ gameId: game.id, playerId, joinCode: game.joinCode })
    } catch {
      setError('Could not join. Try again.')
      setJoining(false)
    }
  }

  return (
    <Screen>
      <button onClick={onBack} className="self-start text-sm text-muted">
        ← Back
      </button>
      <Logo className="mt-2" />

      <Card>
        <form onSubmit={findGame} className="flex flex-col gap-3">
          <Label>Game code</Label>
          <Input
            placeholder="ABCD"
            value={code}
            autoCapitalize="characters"
            autoCorrect="off"
            autoComplete="off"
            inputMode="text"
            className="text-center text-2xl font-black tracking-[0.3em] uppercase"
            onChange={(e) => {
              setCode(normalizeJoinCode(e.target.value))
              setQueryCode(null)
              setError('')
            }}
            autoFocus={!initialCode}
          />
          {!canPickName && (
            <Button type="submit" full disabled={isLoading && !!queryCode}>
              {isLoading && queryCode ? 'Looking…' : 'Find game'}
            </Button>
          )}
        </form>

        {notFound && (
          <p className="mt-3 text-sm text-b">No game with that code. Check with your host.</p>
        )}
        {alreadyStarted && (
          <p className="mt-3 text-sm text-warn">
            That game has already started — you can't join now.
          </p>
        )}
      </Card>

      {canPickName && (
        <Card className="animate-pop">
          <form onSubmit={doJoin} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label>Your username</Label>
              <span className="text-xs text-muted">
                {game?.players?.length ?? 0} in the lobby
              </span>
            </div>
            <Input
              placeholder="e.g. Sam"
              value={username}
              maxLength={MAX_USERNAME}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
            <ErrorText>{error}</ErrorText>
            <Button type="submit" full disabled={joining}>
              {joining ? 'Joining…' : `Join ${queryCode}`}
            </Button>
          </form>
        </Card>
      )}
      {!canPickName && <ErrorText>{error}</ErrorText>}
    </Screen>
  )
}
