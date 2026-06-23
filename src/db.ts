import { init } from '@instantdb/react'
import schema from '../instant.schema'

// The InstantDB App ID is a public client identifier (safe to ship in the
// bundle). An env var override is supported for multi-environment setups.
export const APP_ID =
  (import.meta.env.VITE_INSTANT_APP_ID as string | undefined) ??
  'b74207cc-14ff-4342-84e4-e6986459d760'

export const db = init({ appId: APP_ID, schema })

export type DB = typeof db
