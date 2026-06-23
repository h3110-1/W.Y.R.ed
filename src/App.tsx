import { useEffect, useState } from 'react'
import { loadSession, saveSession, clearSession, type Session } from './lib/identity'
import { Landing } from './screens/Landing'
import { HostCreate } from './screens/HostCreate'
import { Join } from './screens/Join'
import { GameContainer } from './screens/GameContainer'

type Route = 'landing' | 'host' | 'join'

export default function App() {
  const [session, setSession] = useState<Session | null>(() => loadSession())
  const [route, setRoute] = useState<Route>('landing')

  // Deep link: ?join=CODE drops you straight into the join flow.
  const [deepCode, setDeepCode] = useState<string | undefined>(undefined)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('join')
    if (code && !loadSession()) {
      setDeepCode(code)
      setRoute('join')
    }
  }, [])

  function enterGame(s: Session) {
    saveSession(s)
    setSession(s)
    // clean the URL so a refresh doesn't re-trigger the deep link
    window.history.replaceState(null, '', window.location.pathname)
  }

  function leaveGame() {
    clearSession()
    setSession(null)
    setRoute('landing')
  }

  if (session) {
    return <GameContainer session={session} onLeave={leaveGame} />
  }

  if (route === 'host') {
    return <HostCreate onCreated={enterGame} onBack={() => setRoute('landing')} />
  }

  if (route === 'join') {
    return (
      <Join
        initialCode={deepCode}
        onJoined={enterGame}
        onBack={() => setRoute('landing')}
      />
    )
  }

  return <Landing onHost={() => setRoute('host')} onJoin={() => setRoute('join')} />
}
