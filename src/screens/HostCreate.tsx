import { useState } from 'react'
import { Button, Card, ErrorText, Input, Label, Logo, Screen } from '../components/ui'
import { SettingsForm } from '../components/SettingsForm'
import { isValidCreatorCode } from '../lib/crypto'
import { getDeviceToken } from '../lib/identity'
import { createGameWithUniqueCode } from '../lib/gameActions'
import { DEFAULT_SETTINGS, MAX_USERNAME, type GameSettings } from '../types'
import type { Session } from '../lib/identity'

export function HostCreate({
  onCreated,
  onBack,
}: {
  onCreated: (s: Session) => void
  onBack: () => void
}) {
  const [step, setStep] = useState<'gate' | 'setup'>('gate')
  const [code, setCode] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  const [username, setUsername] = useState('')
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS)
  const [creating, setCreating] = useState(false)

  async function checkCode(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setChecking(true)
    const ok = await isValidCreatorCode(code.trim())
    setChecking(false)
    if (ok) setStep('setup')
    else setError('That creator code is not right.')
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const name = username.trim()
    if (!name) {
      setError('Pick a username.')
      return
    }
    setCreating(true)
    try {
      const res = await createGameWithUniqueCode({
        username: name,
        deviceToken: getDeviceToken(),
        settings,
      })
      onCreated({ gameId: res.gameId, playerId: res.playerId, joinCode: res.joinCode })
    } catch {
      setError('Could not create the game. Try again.')
      setCreating(false)
    }
  }

  return (
    <Screen>
      <button onClick={onBack} className="self-start text-sm text-muted">
        ← Back
      </button>
      <Logo className="mt-2" />

      {step === 'gate' ? (
        <Card>
          <form onSubmit={checkCode} className="flex flex-col gap-3">
            <Label>Creator code</Label>
            <Input
              type="password"
              inputMode="text"
              autoComplete="off"
              placeholder="Enter the host code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
            />
            <ErrorText>{error}</ErrorText>
            <Button type="submit" full disabled={checking || !code.trim()}>
              {checking ? 'Checking…' : 'Continue'}
            </Button>
            <p className="text-center text-xs text-muted">
              Only the app creator has this. Players don't need it — they just join
              with the game code.
            </p>
          </form>
        </Card>
      ) : (
        <form onSubmit={create} className="flex flex-col gap-4">
          <Card>
            <div className="flex flex-col gap-2">
              <Label>Your username</Label>
              <Input
                placeholder="e.g. Jamie"
                value={username}
                maxLength={MAX_USERNAME}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-muted">
                You're the host, but you play too — you'll write your own and vote.
              </p>
            </div>
          </Card>
          <Card>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
              Game settings
            </h2>
            <SettingsForm settings={settings} onChange={setSettings} />
          </Card>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" full disabled={creating}>
            {creating ? 'Creating…' : 'Create game'}
          </Button>
        </form>
      )}
    </Screen>
  )
}
