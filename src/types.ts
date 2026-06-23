export type Phase = 'lobby' | 'voting' | 'reveal' | 'finished'
export type GameStatus = 'lobby' | 'in_progress' | 'finished'
export type Choice = 'A' | 'B'

export interface GameSettings {
  perPlayerCount: number // how many WYRs each player submits
  showCreator: boolean // reveal who wrote each WYR
  showVoters: boolean // reveal who voted for what during reveal
  voteSeconds: number // time allowed to vote per question
  revealSeconds: number // time spent looking at the results per question
}

export const DEFAULT_SETTINGS: GameSettings = {
  perPlayerCount: 2,
  showCreator: true,
  showVoters: true,
  voteSeconds: 30,
  revealSeconds: 15,
}

export const SETTINGS_BOUNDS = {
  perPlayerCount: { min: 1, max: 10 },
  voteSeconds: { min: 5, max: 180 },
  revealSeconds: { min: 5, max: 120 },
}

export const MIN_PLAYERS = 2
export const MAX_USERNAME = 20
export const MAX_WYR_OPTION = 120
