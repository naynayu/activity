import { useEffect, useState } from 'react'
import { forgetMe, measureClockSkew, participantStillExists, readMe } from './data'
import type { Participant as P } from './types'
import { Host } from './views/Host'
import { Join } from './views/Join'
import { Participant } from './views/Participant'
import { Screen } from './views/Screen'

type Route = 'participant' | 'screen' | 'host'
const routeFromHash = (): Route => {
  const h = location.hash.replace('#', '').toLowerCase()
  return h === 'screen' ? 'screen' : h === 'host' ? 'host' : 'participant'
}

export function App() {
  const [route, setRoute] = useState<Route>(routeFromHash)
  const [me, setMe] = useState<P | null>(() => readMe())

  useEffect(() => {
    const onHash = () => setRoute(routeFromHash())
    addEventListener('hashchange', onHash)
    measureClockSkew()
    return () => removeEventListener('hashchange', onHash)
  }, [])

  // Drop a stale identity (e.g. after a reset) before the phone tries to send anything.
  useEffect(() => {
    if (!me) return
    participantStillExists(me.id).then(there => { if (!there) { forgetMe(); setMe(null) } })
  }, [me])

  if (route === 'screen') return <Screen />
  if (route === 'host') return <Host />
  return me ? <Participant me={me} onLeave={() => { forgetMe(); setMe(null) }} /> : <Join onJoined={setMe} />
}
