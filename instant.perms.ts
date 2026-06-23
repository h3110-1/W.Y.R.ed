// Docs: https://www.instantdb.com/docs/permissions
//
// SECURITY NOTE (pragmatic mode):
// This is a no-auth, client-only party app. InstantDB enforces rules on its
// backend, but with no signed-in identity there is nothing trustworthy to key
// host-only powers off of, so these rules are intentionally permissive. Host
// powers are gated in the UI via a per-device token + the creator-code hash.
// A determined technical user could write to the DB directly. That is an
// accepted tradeoff for a friends' party game. To harden later, switch to
// InstantDB auth (magic-code / anonymous) and scope writes to the game host.
import type { InstantRules } from '@instantdb/react'

const rules = {
  $default: {
    allow: {
      view: 'true',
      create: 'true',
      update: 'true',
      delete: 'true',
    },
  },
} satisfies InstantRules

export default rules
