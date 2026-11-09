import { useEffect, useState } from 'react'
import { forgetMe, readMe, stillExists } from './data'
import type { Participant as P } from './types'
import { Host } from './views/Host'
import { Join } from './views/Join'
import { Learner } from './views/Learner'
import { Screen } from './views/Screen'

const route = () => { const h = location.hash.replace('#', '').toLowerCase(); return h === 'screen' ? 'screen' : h === 'host' ? 'host' : 'learner' }

export function App() {
  const [r, setR] = useState(route)
  const [me, setMe] = useState<P | null>(readMe)
  useEffect(() => { const f = () => setR(route()); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f) }, [])
  useEffect(() => { if (me) stillExists(me.id).then(ok => { if (!ok) { forgetMe(); setMe(null) } }) }, [me])
  if (r === 'screen') return <Screen />
  if (r === 'host') return <Host />
  return me ? <Learner me={me} onLeave={() => { forgetMe(); setMe(null) }} /> : <Join onJoined={setMe} />
}
