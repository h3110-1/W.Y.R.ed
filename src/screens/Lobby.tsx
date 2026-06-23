import { useMemo, useState } from 'react'
import { Button, Card, ErrorText, Input, Label, Pill, Screen } from '../components/ui'
import { SettingsForm } from '../components/SettingsForm'
import {
  addQuestion,
  deleteQuestion,
  kickPlayer,
  renamePlayer,
  startGame,
  updateQuestion,
  updateSettings,
  type GameRow,
  type PlayerRow,
  type QuestionRow,
} from '../lib/gameActions'
import { MAX_USERNAME, MAX_WYR_OPTION, MIN_PLAYERS } from '../types'

function authoredBy(questions: QuestionRow[], playerId: string) {
  return questions.filter((q) => q.creator?.id === playerId)
}

// ---- Add / edit a single would-you-rather --------------------------------

function WyrFields({
  a,
  b,
  setA,
  setB,
  idPrefix,
}: {
  a: string
  b: string
  setA: (v: string) => void
  setB: (v: string) => void
  idPrefix: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="w-7 shrink-0 text-center text-sm font-black text-a">A</span>
        <Input
          id={`${idPrefix}-a`}
          placeholder="Would you rather…"
          value={a}
          maxLength={MAX_WYR_OPTION}
          onChange={(e) => setA(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="w-7 shrink-0 text-center text-sm font-black text-b">B</span>
        <Input
          id={`${idPrefix}-b`}
          placeholder="…or rather?"
          value={b}
          maxLength={MAX_WYR_OPTION}
          onChange={(e) => setB(e.target.value)}
        />
      </div>
    </div>
  )
}

function AddWyr({ gameId, creatorId }: { gameId: string; creatorId: string }) {
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    setError('')
    if (!a.trim() || !b.trim()) {
      setError('Fill in both options.')
      return
    }
    setBusy(true)
    try {
      await addQuestion({ gameId, creatorId, optionA: a.trim(), optionB: b.trim() })
      setA('')
      setB('')
    } catch {
      setError('Could not add that. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border p-3">
      <WyrFields a={a} b={b} setA={setA} setB={setB} idPrefix="new" />
      <ErrorText>{error}</ErrorText>
      <Button variant="secondary" onClick={submit} disabled={busy}>
        {busy ? 'Adding…' : 'Add this one'}
      </Button>
    </div>
  )
}

function EditableWyr({
  question,
  canEdit,
  showAuthor,
}: {
  question: QuestionRow
  canEdit: boolean
  showAuthor: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [a, setA] = useState(question.optionA)
  const [b, setB] = useState(question.optionB)
  const [busy, setBusy] = useState(false)

  async function save() {
    if (!a.trim() || !b.trim()) return
    setBusy(true)
    try {
      await updateQuestion(question.id, { optionA: a.trim(), optionB: b.trim() })
      setEditing(false)
    } finally {
      setBusy(false)
    }
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-brand/50 bg-surface-2 p-3">
        <WyrFields a={a} b={b} setA={setA} setB={setB} idPrefix={`edit-${question.id}`} />
        <div className="flex gap-2">
          <Button variant="secondary" onClick={save} disabled={busy} className="flex-1">
            Save
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setA(question.optionA)
              setB(question.optionB)
              setEditing(false)
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-surface-2 p-3">
      <div className="text-sm">
        <span className="font-semibold text-a">{question.optionA}</span>
        <span className="px-1.5 text-muted">vs</span>
        <span className="font-semibold text-b">{question.optionB}</span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        {showAuthor ? (
          <span className="text-xs text-muted">by {question.creator?.username ?? '—'}</span>
        ) : (
          <span />
        )}
        {canEdit && (
          <div className="flex gap-3">
            <button className="text-xs font-semibold text-brand" onClick={() => setEditing(true)}>
              Edit
            </button>
            <button
              className="text-xs font-semibold text-b"
              onClick={() => deleteQuestion(question.id)}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ---- Host: rename a player ------------------------------------------------

function PlayerRowItem({
  player,
  authored,
  required,
  isHostView,
  isMe,
}: {
  player: PlayerRow
  authored: number
  required: number
  isHostView: boolean
  isMe: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(player.username)
  const ready = authored >= required

  return (
    <div className="flex items-center gap-2 py-2">
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex gap-2">
            <Input
              value={name}
              maxLength={MAX_USERNAME}
              onChange={(e) => setName(e.target.value)}
              className="py-2"
            />
            <Button
              variant="secondary"
              className="px-3 py-2"
              onClick={async () => {
                if (name.trim()) await renamePlayer(player.id, name.trim())
                setEditing(false)
              }}
            >
              Save
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold">{player.username}</span>
            {player.isHost && <Pill tone="warn">host</Pill>}
            {isMe && !player.isHost && <Pill>you</Pill>}
          </div>
        )}
      </div>
      {!editing && (
        <>
          <Pill tone={ready ? 'good' : 'default'}>
            {authored}/{required}
          </Pill>
          {isHostView && !isMe && (
            <div className="flex gap-2">
              <button
                className="text-xs font-semibold text-brand"
                onClick={() => setEditing(true)}
              >
                Rename
              </button>
              <button
                className="text-xs font-semibold text-b"
                onClick={() => kickPlayer(player.id)}
              >
                Kick
              </button>
            </div>
          )}
          {isHostView && isMe && (
            <button
              className="text-xs font-semibold text-brand"
              onClick={() => setEditing(true)}
            >
              Rename
            </button>
          )}
        </>
      )}
    </div>
  )
}

// ---- Lobby ----------------------------------------------------------------

export function Lobby({
  game,
  players,
  questions,
  me,
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
  const required = game.settings.perPlayerCount
  const myQuestions = useMemo(() => authoredBy(questions, me.id), [questions, me.id])
  const [showSettings, setShowSettings] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [copied, setCopied] = useState(false)
  const [starting, setStarting] = useState(false)

  const counts = useMemo(() => {
    const m = new Map<string, number>()
    for (const p of players) m.set(p.id, authoredBy(questions, p.id).length)
    return m
  }, [players, questions])

  const everyoneReady = players.every((p) => (counts.get(p.id) ?? 0) >= required)
  const enoughPlayers = players.length >= MIN_PLAYERS
  const canStart = everyoneReady && enoughPlayers

  async function share() {
    const url = `${window.location.origin}${window.location.pathname}?join=${game.joinCode}`
    const text = `Join my Would You Rather game — code ${game.joinCode}`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'w.y.r.ed', text, url })
        return
      }
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* user cancelled share */
    }
  }

  async function start() {
    setStarting(true)
    try {
      await startGame(game, questions)
    } catch {
      setStarting(false)
    }
  }

  return (
    <Screen>
      <div className="flex items-center justify-between">
        <button onClick={onLeave} className="text-sm text-muted">
          ← Leave
        </button>
        <Pill>
          {players.length} player{players.length === 1 ? '' : 's'}
        </Pill>
      </div>

      {/* Join code */}
      <Card className="text-center">
        <Label>Game code</Label>
        <div className="my-1 text-5xl font-black tracking-[0.2em]">{game.joinCode}</div>
        <Button variant="secondary" full onClick={share}>
          {copied ? 'Link copied!' : 'Share invite'}
        </Button>
      </Card>

      {/* My would-you-rathers */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
            Your would-you-rathers
          </h2>
          <Pill tone={myQuestions.length >= required ? 'good' : 'warn'}>
            {myQuestions.length}/{required}
          </Pill>
        </div>
        <div className="flex flex-col gap-2">
          {myQuestions.map((q) => (
            <EditableWyr key={q.id} question={q} canEdit showAuthor={false} />
          ))}
          {myQuestions.length < required && (
            <AddWyr gameId={game.id} creatorId={me.id} />
          )}
          {myQuestions.length >= required && (
            <p className="text-center text-xs text-good">
              You're all set — waiting on the others.
            </p>
          )}
        </div>
      </Card>

      {/* Players */}
      <Card>
        <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-muted">Players</h2>
        <div className="divide-y divide-border">
          {players.map((p) => (
            <PlayerRowItem
              key={p.id}
              player={p}
              authored={counts.get(p.id) ?? 0}
              required={required}
              isHostView={isHost}
              isMe={p.id === me.id}
            />
          ))}
        </div>
      </Card>

      {/* Host controls */}
      {isHost && (
        <>
          <Card>
            <button
              className="flex w-full items-center justify-between"
              onClick={() => setShowSettings((s) => !s)}
            >
              <span className="text-sm font-bold uppercase tracking-wide text-muted">
                Settings
              </span>
              <span className="text-muted">{showSettings ? '▲' : '▼'}</span>
            </button>
            {showSettings && (
              <div className="mt-4">
                <SettingsForm
                  settings={game.settings}
                  onChange={(s) => updateSettings(game.id, s)}
                />
              </div>
            )}
          </Card>

          <Card>
            <button
              className="flex w-full items-center justify-between"
              onClick={() => setShowReview((s) => !s)}
            >
              <span className="text-sm font-bold uppercase tracking-wide text-muted">
                Review all entries ({questions.length})
              </span>
              <span className="text-muted">{showReview ? '▲' : '▼'}</span>
            </button>
            {showReview && (
              <div className="mt-3 flex flex-col gap-2">
                {questions.length === 0 && (
                  <p className="text-xs text-muted">Nothing submitted yet.</p>
                )}
                {questions.map((q) => (
                  <EditableWyr key={q.id} question={q} canEdit showAuthor />
                ))}
              </div>
            )}
          </Card>

          <div className="sticky bottom-0 -mx-4 flex flex-col gap-2 bg-gradient-to-t from-bg via-bg to-transparent px-4 pb-3 pt-4">
            <Button full onClick={start} disabled={!canStart || starting}>
              {starting ? 'Starting…' : 'Start game'}
            </Button>
            {!canStart && (
              <p className="text-center text-xs text-muted">
                {!enoughPlayers
                  ? `Need at least ${MIN_PLAYERS} players to start.`
                  : 'Waiting for everyone to finish their entries.'}
              </p>
            )}
          </div>
        </>
      )}

      {!isHost && (
        <p className="text-center text-xs text-muted">
          Waiting for the host to start the game…
        </p>
      )}
    </Screen>
  )
}
