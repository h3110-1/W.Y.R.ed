import { SETTINGS_BOUNDS, type GameSettings } from '../types'
import { Label } from './ui'

function clamp(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min
  return Math.min(max, Math.max(min, n))
}

function Stepper({
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  value: number
  min: number
  max: number
  suffix?: string
  onChange: (n: number) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1, min, max))}
        className="h-10 w-10 shrink-0 rounded-xl border border-border bg-surface-2 text-xl font-bold active:scale-95 disabled:opacity-30"
        disabled={value <= min}
        aria-label="decrease"
      >
        −
      </button>
      <div className="flex-1 text-center text-lg font-bold tabular-nums">
        {value}
        {suffix ? <span className="text-sm font-medium text-muted"> {suffix}</span> : null}
      </div>
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1, min, max))}
        className="h-10 w-10 shrink-0 rounded-xl border border-border bg-surface-2 text-xl font-bold active:scale-95 disabled:opacity-30"
        disabled={value >= max}
        aria-label="increase"
      >
        +
      </button>
    </div>
  )
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (b: boolean) => void
  label: string
  hint: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 text-left"
    >
      <span>
        <span className="block text-[15px] font-semibold">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? 'bg-brand' : 'bg-surface-2 border border-border'
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </span>
    </button>
  )
}

export function SettingsForm({
  settings,
  onChange,
  lockPerPlayer = false,
}: {
  settings: GameSettings
  onChange: (s: GameSettings) => void
  lockPerPlayer?: boolean
}) {
  const set = (patch: Partial<GameSettings>) => onChange({ ...settings, ...patch })
  const b = SETTINGS_BOUNDS

  return (
    <div className="flex flex-col gap-5">
      {!lockPerPlayer && (
        <div className="flex flex-col gap-2">
          <Label>Would-you-rathers per player</Label>
          <Stepper
            value={settings.perPlayerCount}
            min={b.perPlayerCount.min}
            max={b.perPlayerCount.max}
            onChange={(n) => set({ perPlayerCount: n })}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label>Seconds to vote</Label>
        <Stepper
          value={settings.voteSeconds}
          min={b.voteSeconds.min}
          max={b.voteSeconds.max}
          suffix="s"
          onChange={(n) => set({ voteSeconds: n })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Seconds to view results</Label>
        <Stepper
          value={settings.revealSeconds}
          min={b.revealSeconds.min}
          max={b.revealSeconds.max}
          suffix="s"
          onChange={(n) => set({ revealSeconds: n })}
        />
      </div>

      <div className="h-px bg-border" />

      <Toggle
        checked={settings.showCreator}
        onChange={(v) => set({ showCreator: v })}
        label="Show who wrote each one"
        hint="Reveal the author alongside the question"
      />
      <Toggle
        checked={settings.showVoters}
        onChange={(v) => set({ showVoters: v })}
        label="Show who voted for what"
        hint="During the results, reveal each player's pick"
      />
    </div>
  )
}
