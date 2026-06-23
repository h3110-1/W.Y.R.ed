import { Button, Logo, Screen } from '../components/ui'

export function Landing({
  onHost,
  onJoin,
}: {
  onHost: () => void
  onJoin: () => void
}) {
  return (
    <Screen>
      <div className="flex-1 flex flex-col justify-center gap-8 py-10">
        <Logo />
        <div className="flex flex-col gap-3">
          <Button full onClick={onJoin}>
            Join a game
          </Button>
          <Button full variant="secondary" onClick={onHost}>
            Host a game
          </Button>
        </div>
        <p className="text-center text-xs text-muted">
          Everyone writes their own would-you-rathers, then the whole room votes.
        </p>
      </div>
    </Screen>
  )
}
