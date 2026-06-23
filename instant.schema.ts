// Docs: https://www.instantdb.com/docs/modeling-data
import { i } from '@instantdb/react'

const _schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
    }),
    games: i.entity({
      joinCode: i.string().unique().indexed(),
      status: i.string(), // 'lobby' | 'in_progress' | 'finished'
      phase: i.string(), // 'lobby' | 'voting' | 'reveal' | 'finished'
      currentIndex: i.number(),
      questionOrder: i.json(), // string[] of question ids, set at game start
      phaseEndsAt: i.number().optional(), // epoch ms; null when paused/lobby
      hostPlayerId: i.string().optional(),
      createdAt: i.number().indexed(),
      // settings: { perPlayerCount, showCreator, showVoters, voteSeconds, revealSeconds }
      settings: i.json(),
    }),
    players: i.entity({
      username: i.string(),
      deviceToken: i.string().indexed(), // local secret tying browser <-> player
      isHost: i.boolean(),
      joinedAt: i.number(),
    }),
    questions: i.entity({
      optionA: i.string(),
      optionB: i.string(),
      createdAt: i.number(),
    }),
    votes: i.entity({
      // deterministic unique key `${questionId}_${playerId}` => one vote per player/question
      key: i.string().unique().indexed(),
      choice: i.string(), // 'A' | 'B'
      createdAt: i.number(),
    }),
  },
  links: {
    gamePlayers: {
      forward: { on: 'players', has: 'one', label: 'game', onDelete: 'cascade' },
      reverse: { on: 'games', has: 'many', label: 'players' },
    },
    gameQuestions: {
      forward: { on: 'questions', has: 'one', label: 'game', onDelete: 'cascade' },
      reverse: { on: 'games', has: 'many', label: 'questions' },
    },
    questionCreator: {
      forward: { on: 'questions', has: 'one', label: 'creator' },
      reverse: { on: 'players', has: 'many', label: 'createdQuestions' },
    },
    questionVotes: {
      forward: { on: 'votes', has: 'one', label: 'question', onDelete: 'cascade' },
      reverse: { on: 'questions', has: 'many', label: 'votes' },
    },
    playerVotes: {
      forward: { on: 'votes', has: 'one', label: 'player', onDelete: 'cascade' },
      reverse: { on: 'players', has: 'many', label: 'votes' },
    },
  },
  rooms: {},
})

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema

export type { AppSchema }
export default schema
