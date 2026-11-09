import { useMemo, useState } from 'react'
import { Bar, Qr, StatusDot } from '../components'
import { HOST_PIN } from '../config'
import { STEPS } from '../content'
import { setSession, useSession } from '../data'
import { dbDelete, dbUpdate, useTable } from '../store'
import { Board, leaderboard } from './Quiz'
import type { AnswerRow, HelpRow, Participant, ProgressRow } from '../types'

const ok = () => { try { return sessionStorage.getItem('wp-host') === '1' } catch { return false } }

export function Host() {
  const [open, setOpen] = useState(ok)
  const [pin, setPin] = useState('')
  const go = () => { if (pin === HOST_PIN) { try { sessionStorage.setItem('wp-host', '1') } catch { /* ignore */ } setOpen(true) } }
  if (open) return <Console />
  return (
    <div className="phone" style={{ paddingTop: 80 }}>
      <div className="card card-lg"><h2>Host console</h2>
        <input className="input" type="password" inputMode="numeric" placeholder="PIN" value={pin} onChange={e => setPin(e.target.value)} onKeyDown={e => e.key === 'Enter' && go()} />
        <button className="btn btn-primary btn-big" onClick={go}>Open</button></div>
    </div>
  )
}

function Console() {
  const s = useSession()
  const people = useTable<Participant>('participants').rows
  const progress = useTable<ProgressRow>('progress').rows
  const help = useTable<HelpRow>('help').rows
  const answers = useTable<AnswerRow>('answers').rows
  const [msg, setMsg] = useState('')
  const rows = useMemo(() => {
    if (!s) return []
    const n = STEPS[s.step].tasks.length
    return people.map(p => {
      const done = progress.filter(x => x.participant_id === p.id && x.step === s.step).length
      const stuck = help.some(h => h.participant_id === p.id && h.stuck && h.step === s.step)
      return { p, done, n, stuck }
    }).sort((a, b) => Number(b.stuck) - Number(a.stuck) || a.done - b.done || a.p.name.localeCompare(b.p.name))
  }, [s, people, progress, help])
  if (!s) return <div className="host"><div className="skel" /></div>
  const step = STEPS[s.step]
  const finished = rows.filter(r => r.done >= r.n).length
  const go = (i: number) => setSession({ step: Math.max(0, Math.min(STEPS.length - 1, i)) })
  const reset = () => {
    if (!confirm('Remove everyone and all progress? Do this after the session.')) return
    people.forEach(p => dbDelete('participants', { id: p.id }))
    setSession({ step: 0, message: null })
  }
  return (
    <div className="host">
      <header className="phone-head"><h2 style={{ margin: 0 }}>Host <StatusDot /></h2><a className="btn" href="#screen" target="_blank">Open projector screen ↗</a></header>
      <div className="card">
        <div className="muted small">Step {s.step + 1} of {STEPS.length} · about {step.minutes} min</div>
        <h2 style={{ marginTop: 4 }}>{step.title}</h2>
        <p>{step.idea}</p>
        <div className="two">
          <button className="btn btn-big" disabled={s.step === 0} onClick={() => go(s.step - 1)}>← Back</button>
          <button className="btn btn-primary btn-big" disabled={s.step === STEPS.length - 1} onClick={() => go(s.step + 1)}>Next step →</button>
        </div>
      </div>
      <div className="card">
        <div className="row"><b>{finished} of {people.length} finished this step</b><span className="muted small">{rows.filter(r => r.stuck).length} stuck</span></div>
        <Bar done={finished} total={people.length} />
        {rows.map(r => (
          <div key={r.p.id} className={`q ${r.stuck ? 'q-stuck' : ''}`}>
            <div className="q-body"><b>{r.p.name}</b> {r.stuck && '✋'}</div>
            <span className="muted small">{r.done}/{r.n}</span>
            {r.stuck && <button className="btn" onClick={() => dbUpdate('help', { participant_id: r.p.id }, { stuck: false })}>Helped</button>}
          </div>
        ))}
        {people.length === 0 && <p className="muted">Nobody has joined yet. Show the QR code.</p>}
      </div>
      <div className="card">
        <div className="row"><b>Quick quiz</b><span className="muted small">{new Set(answers.map(a => a.participant_id)).size} answering</span></div>
        <div className="two">
          <button className="btn" onClick={() => setSession({ quiz_on: !s.quiz_on, quiz_open: false, quiz_reveal: false })}>{s.quiz_on ? 'Back to the steps' : 'Show quiz on phones'}</button>
          <button className="btn" disabled={!s.quiz_on || s.quiz_reveal} onClick={() => setSession({ quiz_open: !s.quiz_open })}>{s.quiz_open ? 'Close answers' : 'Open answers'}</button>
        </div>
        <button className="btn btn-primary btn-big" disabled={!s.quiz_on} onClick={() => setSession({ quiz_open: false, quiz_reveal: !s.quiz_reveal })}>{s.quiz_reveal ? 'Hide answers and board' : 'Reveal answers and leaderboard'}</button>
        {s.quiz_reveal && <div style={{ marginTop: 12 }}><Board rows={leaderboard(people, answers)} /></div>}
      </div>
      <div className="card">
        <b>Message to every phone</b>
        <div className="row" style={{ marginTop: 8 }}>
          <input className="input" placeholder="e.g. Break until 11:15" value={msg} onChange={e => setMsg(e.target.value)} />
          <button className="btn" onClick={() => { setSession({ message: msg.trim() || null }); setMsg('') }}>Send</button>
          <button className="btn" onClick={() => setSession({ message: null })}>Clear</button>
        </div>
        {s.message && <p className="muted small">Showing: {s.message}</p>}
      </div>
      <div className="card center"><Qr url={location.origin + location.pathname} /><p className="muted small">Learners scan this to join</p></div>
      <button className="btn" onClick={reset}>Start over (after the session)</button>
    </div>
  )
}
