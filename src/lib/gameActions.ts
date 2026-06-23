import { id } from '@instantdb/react'
import { db } from '../db'
import type { Choice, GameSettings } from '../types'
import { generateJoinCode } from './codes'
import { deterministicVoteId } from './voteId'

// Minimal shapes for the bits of the query result these helpers touch.
export interface GameRow {
  id: string
  joinCode: string
  status: string
  phase: string
  currentIndex: number
  questionOrder: string[]
  phaseEndsAt?: number | null
  hostPlayerId?: string | null
  createdAt: number
  settings: GameSettings
}

export interface PlayerRow {
  id: string
  username: string
  deviceToken: string
  isHost: boolean
  joinedAt: number
}

export interface QuestionRow {
  id: string
  optionA: string
  optionB: string
  createdAt: number
  creator?: PlayerRow
  votes?: VoteRow[]
}

export interface VoteRow {
  id: string
  key: string
  choice: Choice
  createdAt: number
  player?: PlayerRow
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ---- Create / join -------------------------------------------------------

export interface CreateResult {
  gameId: string
  playerId: string
  joinCode: string
}

export async function createGame(opts: {
  username: string
  deviceToken: string
  settings: GameSettings
  joinCode: string
}): Promise<CreateResult> {
  const gameId = id()
  const playerId = id()
  const now = Date.now()
  await db.transact([
    db.tx.games[gameId].update({
      joinCode: opts.joinCode,
      status: 'lobby',
      phase: 'lobby',
      currentIndex: 0,
      questionOrder: [],
      phaseEndsAt: null,
      hostPlayerId: playerId,
      createdAt: now,
      settings: opts.settings,
    }),
    db.tx.players[playerId]
      .update({
        username: opts.username,
        deviceToken: opts.deviceToken,
        isHost: true,
        joinedAt: now,
      })
      .link({ game: gameId }),
  ])
  return { gameId, playerId, joinCode: opts.joinCode }
}

// Try to create a game, retrying on the rare join-code collision.
export async function createGameWithUniqueCode(opts: {
  username: string
  deviceToken: string
  settings: GameSettings
}): Promise<CreateResult> {
  let lastErr: unknown
  for (let attempt = 0; attempt < 6; attempt++) {
    const joinCode = generateJoinCode(attempt < 3 ? 4 : 5)
    try {
      return await createGame({ ...opts, joinCode })
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr ?? new Error('Could not create game')
}

export async function joinGame(opts: {
  gameId: string
  username: string
  deviceToken: string
}): Promise<string> {
  const playerId = id()
  await db.transact(
    db.tx.players[playerId]
      .update({
        username: opts.username,
        deviceToken: opts.deviceToken,
        isHost: false,
        joinedAt: Date.now(),
      })
      .link({ game: opts.gameId }),
  )
  return playerId
}

// ---- Lobby edits ---------------------------------------------------------

export async function addQuestion(opts: {
  gameId: string
  creatorId: string
  optionA: string
  optionB: string
}): Promise<void> {
  const qid = id()
  await db.transact(
    db.tx.questions[qid]
      .update({
        optionA: opts.optionA,
        optionB: opts.optionB,
        createdAt: Date.now(),
      })
      .link({ game: opts.gameId, creator: opts.creatorId }),
  )
}

export async function updateQuestion(
  questionId: string,
  patch: { optionA?: string; optionB?: string },
): Promise<void> {
  await db.transact(db.tx.questions[questionId].update(patch))
}

export async function deleteQuestion(questionId: string): Promise<void> {
  await db.transact(db.tx.questions[questionId].delete())
}

export async function renamePlayer(playerId: string, username: string): Promise<void> {
  await db.transact(db.tx.players[playerId].update({ username }))
}

export async function kickPlayer(playerId: string): Promise<void> {
  await db.transact(db.tx.players[playerId].delete())
}

export async function updateSettings(
  gameId: string,
  settings: GameSettings,
): Promise<void> {
  await db.transact(db.tx.games[gameId].update({ settings }))
}

// ---- Game flow -----------------------------------------------------------

export async function startGame(game: GameRow, questions: QuestionRow[]): Promise<void> {
  const order = shuffle(questions.map((q) => q.id))
  const now = Date.now()
  await db.transact(
    db.tx.games[game.id].update({
      status: 'in_progress',
      phase: 'voting',
      currentIndex: 0,
      questionOrder: order,
      phaseEndsAt: now + game.settings.voteSeconds * 1000,
    }),
  )
}

// Compute and write the next phase. Used by both the host clock (on timer
// expiry) and the host "skip" button. Idempotent-ish: callers should only fire
// from the correct phase.
export async function advancePhase(game: GameRow): Promise<void> {
  const now = Date.now()
  if (game.phase === 'voting') {
    await db.transact(
      db.tx.games[game.id].update({
        phase: 'reveal',
        phaseEndsAt: now + game.settings.revealSeconds * 1000,
      }),
    )
    return
  }
  if (game.phase === 'reveal') {
    const nextIndex = game.currentIndex + 1
    if (nextIndex < game.questionOrder.length) {
      await db.transact(
        db.tx.games[game.id].update({
          phase: 'voting',
          currentIndex: nextIndex,
          phaseEndsAt: now + game.settings.voteSeconds * 1000,
        }),
      )
    } else {
      await db.transact(
        db.tx.games[game.id].update({
          phase: 'finished',
          status: 'finished',
          phaseEndsAt: null,
        }),
      )
    }
  }
}

// Host closes the game; cascade removes players/questions/votes.
export async function closeGame(gameId: string): Promise<void> {
  await db.transact(db.tx.games[gameId].delete())
}

export async function castVote(opts: {
  questionId: string
  playerId: string
  choice: Choice
}): Promise<void> {
  // Deterministic id => one vote record per (question, player). Re-voting
  // overwrites the same row, so no duplicate votes even without a pushed
  // unique index on the backend.
  const voteId = deterministicVoteId(opts.questionId, opts.playerId)
  const key = `${opts.questionId}_${opts.playerId}`
  await db.transact(
    db.tx.votes[voteId]
      .update({ key, choice: opts.choice, createdAt: Date.now() })
      .link({ question: opts.questionId, player: opts.playerId }),
  )
}
