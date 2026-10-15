import { useState } from 'react'
import { join } from '../data'
import type { Participant } from '../types'

export function Join({ onJoined }: { onJoined: (p: Participant) => void }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function go() {
    if (!name.trim() || busy) return
    setBusy(true); setErr('')
    try { onJoined(await join(name)) }
    catch { setErr('Could not join. Check your connection and try again.'); setBusy(false) }
  }
  return (
    <div className="phone" style={{ paddingTop: 64 }}>
      <div className="center"><div className="logo">🩺</div><h1>The CV Clinic</h1><p className="muted">Join with your first name. Scanning again brings you back.</p></div>
      <div className="card card-lg">
        <input className="input" placeholder="Your name" maxLength={40} value={name} autoFocus
          onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && go()} />
        {err && <p className="neg small">{err}</p>}
        <button className="btn btn-primary btn-big" disabled={!name.trim() || busy} onClick={go}>{busy ? 'Joining…' : 'Join'}</button>
      </div>
    </div>
  )
}
