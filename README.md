# w.y.r.ed — Would You Rather

A realtime, mobile-first "Would You Rather" party game. One person hosts behind a
creator code and configures the round; everyone else joins with a 4-character
code, writes their own would-you-rathers, then the whole room votes question by
question with live timers and reveals.

Built to be **serverless**: a React SPA on **Cloudflare Pages** talking to
**InstantDB** (realtime database). There is no backend of our own.

## How it plays

1. **Host** taps *Host a game*, enters the creator code, picks a username, and
   sets the round options (entries per player, vote/reveal timers, whether the
   author and individual votes are shown).
2. **Players** tap *Join a game*, enter the code, pick a username, and land in the
   lobby. Everyone writes their required number of would-you-rathers.
3. In the lobby the **host** can rename players, edit or delete any entry (for
   anything inappropriate), tweak settings, and start once everyone is ready
   (min 2 players).
4. The game shuffles all entries and runs them one at a time:
   - **Voting** — tap A or B (you can change until the timer ends). The screen
     shows who still hasn't voted. Optionally shows who wrote it.
   - **Reveal** — the A/B split, the winner, and (optionally) who voted for what.
   - The **host** can skip the remaining time of either phase.
5. A **results** recap ends the round. The host can **play again** — everyone is
   sent back to the lobby (same players and settings, fresh entries) — or close
   the game for good.

## Architecture notes

- **Realtime + state:** a single InstantDB query subscribes to the game graph
  (`games → players`, `games → questions → votes`). All clients render from it.
- **Timers without a server:** each phase stores a `phaseEndsAt` timestamp;
  every client computes the countdown from it (no drift). Only the **host's
  device** writes the phase transition when the timer expires — see
  `useHostClock` in `src/screens/GameContainer.tsx`. If the host disconnects the
  game pauses and resumes when they return.
- **Identity:** each browser stores a random `deviceToken` and the current
  session in `localStorage`, so a refresh rejoins as the same player.
- **One vote per player/question:** vote record ids are derived deterministically
  from `(questionId, playerId)` (`src/lib/voteId.ts`), so re-voting overwrites
  instead of inserting — no duplicate votes even without a pushed unique index.

## Security model (read this)

This is a no-auth, client-only party app, with a deliberately **pragmatic**
security posture:

- The **creator code** is checked client-side against a SHA-256 hash baked into
  the bundle (`src/lib/crypto.ts`). Only the hash ships, never the plaintext —
  but a hash in a public bundle is a *soft gate*, not a hard boundary.
- The InstantDB **App ID is public** by design (it's a client identifier).
- Host-only powers are gated in the UI. Because there's no signed-in identity,
  the database permission rules (`instant.perms.ts`) are intentionally
  permissive — a determined technical user could write to the DB directly.

This is fine for playing with friends. To harden it later, switch to InstantDB
auth (magic-code / anonymous) and scope writes to the game host.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
```

The InstantDB App ID is baked into `src/db.ts` and can be overridden with the
`VITE_INSTANT_APP_ID` env var (see `.env.example`).

## (Optional) Push schema & permissions to InstantDB

The app works without this — InstantDB creates attributes on the fly. Pushing
just formalizes indexes, the unique constraints, and the permission rules.

```bash
npx instant-cli login          # opens a browser to authenticate
npm run push-schema            # pushes instant.schema.ts
npm run push-perms             # pushes instant.perms.ts
```

(Alternatively set `INSTANT_CLI_AUTH_TOKEN` for non-interactive CI.)

## Build

```bash
npm run build    # type-checks then outputs static site to dist/
npm run preview  # serve the production build locally
```

## Deploy to Cloudflare Pages

1. Push this repo to GitHub/GitLab.
2. In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to
   Git**, select the repo.
3. Build settings:
   - **Framework preset:** Vite (or None)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. (Optional) add `VITE_INSTANT_APP_ID` under the project's environment
   variables to override the baked-in App ID.
5. Deploy. `public/_redirects` (`/* /index.html 200`) keeps the SPA routes
   working.

Prefer the CLI? `npm run build` then `npx wrangler pages deploy dist`.

## Project layout

```
instant.schema.ts        InstantDB entities + links
instant.perms.ts         InstantDB permission rules
src/db.ts                InstantDB client init (App ID)
src/types.ts             Settings, bounds, shared types
src/lib/                 crypto gate, identity, join codes, timers,
                         deterministic vote ids, game actions (all mutations)
src/components/          UI primitives, settings form, timer bar
src/screens/             Landing, HostCreate, Join, GameContainer,
                         Lobby, Voting, Reveal, Results
```
