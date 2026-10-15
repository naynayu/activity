import { useMemo, useState } from 'react'
import { Board } from '../components/Board'
import { Questions } from '../components/Questions'
import { HOST_PIN } from '../config'
import { GLOW, PHASES, PREPARED_QA, phaseIndex } from '../content'
import { clock, serverNow, setSession, useCountdown, useRows, useSession } from '../data'
import { buildBoard } from '../scoring'
import { sb } from '../supabase'
import type { AwardRow, Participant, Phase, QuestionRow, ScoreRow, SubmissionRow, VoteRow } from '../types'

const ZERO = '00000000-0000-0000-0000-000000000000'

export function Host() {
  const [ok, setOk] = useState(() => { try { return sessionStorage.getItem('cv-host') === '1' } catch { return false } })
  const [pin, setPin] = useState('')
  if (!ok) {
    return (
      <div className="phone" style={{ paddingTop: 80 }}>
        <div className="card card-lg">
          <h2>Host console</h2>
          <input className="input" type="password" inputMode="numeric" placeholder="PIN" value={pin} onChange={e => setPin(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && pin === HOST_PIN && (sessionStorage.setItem('cv-host', '1'), setOk(true))} />
          <button className="btn btn-primary btn-big" onClick={() => { if (pin === HOST_PIN) { try { sessionStorage.setItem('cv-host', '1') } catch { /* ignore */ } setOk(true) } }}>Open</button>
        </div>
      </div>
    )
  }
  return <Console />
}

function Console() {
  const { session } = useSession()
  const people = useRows<Participant>('participants', [], 5000)
  const scores = useRows<ScoreRow>('scores', [], 4000)
  const awards = useRows<AwardRow>('awards', [], 4000)
  const questions = useRows<QuestionRow>('questions', [], 5000)
  const board = useMemo(() => buildBoard(people.rows, scores.rows, awards.rows), [people.rows, scores.rows, awards.rows])
  const left = useCountdown(session?.timer_end)
  const [msg, setMsg] = useState('')
  if (!session) return <div className="phone"><p>Loading…</p></div>

  const cur = Math.max(0, phaseIndex(session.phase))
  const go = (phase: Phase) => setSession({ phase, step: Math.max(session.step, phaseIndex(phase)), reveal: false, timer_end: null })
  const timer = (sec: number, reveal = false) => setSession({ timer_end: new Date(serverNow() + sec * 1000).toISOString(), reveal })
  const patient = Number(session.round.replace('cv', '')) || 1
  const remaining = PHASES.slice(cur).reduce((n, p) => n + p.minutes, 0)

  return (
    <div className="host">
      <header className="phone-head"><div><b>Host console</b><div className="faint small">{people.rows.length} joined · {scores.rows.length} scored · about {remaining} min left</div></div>
        <a className="btn" href="#screen" target="_blank" rel="noreferrer">Open screen</a></header>

      <section className="card"><h3>Run of show</h3>
        {PHASES.map((p, i) => (
          <button key={p.key} className={`step ${i === cur ? 'now' : i < session.step ? 'done' : ''}`} onClick={() => go(p.key)}>
            <span>{i < session.step && i !== cur ? '✓' : i + 1}</span><span>{p.title}</span><small>{p.minutes} min</small>
          </button>
        ))}
        <div className="tips">{PHASES[cur].host.map(t => <p key={t}>{t}</p>)}</div>
      </section>

      <section className="card"><h3>Controls</h3>
        <div className="row"><span>Patient {patient}</span>
          <span><button className="btn" onClick={() => setSession({ round: `cv${Math.max(1, patient - 1)}`, reveal: false, timer_end: null })}>−</button>
            <button className="btn btn-primary" onClick={() => setSession({ round: `cv${patient + 1}`, reveal: false, timer_end: null })}>Next patient</button></span></div>
        {session.phase === 'hirepass' && <button className="btn btn-primary btn-big" onClick={() => timer(6, true)}>Show CV for 6s {left ? `(${left})` : ''}</button>}
        {session.phase === 'glowup' && <button className="btn btn-primary btn-big" onClick={() => timer(60)}>Start 60s {left != null ? `(${clock(left)})` : ''}</button>}
        {(session.phase === 'practice' || session.phase === 'compare') && <button className="btn btn-primary btn-big" onClick={() => setSession({ reveal: !session.reveal })}>{session.reveal ? 'Hide it again' : session.phase === 'compare' ? 'Reveal the good CV' : 'Reveal the answer'}</button>}
        <div className="row"><input className="input" placeholder="Banner message for every screen" value={msg} onChange={e => setMsg(e.target.value)} />
          <button className="btn" onClick={() => { setSession({ message: msg.trim() || null }); if (!msg.trim()) setMsg('') }}>{msg.trim() ? 'Show' : 'Clear'}</button></div>
        {session.message && <button className="btn" onClick={() => { setMsg(''); setSession({ message: null }) }}>Clear banner</button>}
      </section>

      {session.phase === 'hirepass' && <Votes round={session.round} />}
      {session.phase === 'glowup' && <Picks round={session.round} people={people.rows} />}
      <Award people={people.rows} board={board} />

      <section className="card"><h3>Leaderboard <small className="faint">({board.length})</small></h3><Board rows={board} limit={50} /></section>

      <section className="card"><h3>Questions to answer afterwards</h3>
        <Questions mode="host" />
        <div className="row">
          <button className="btn" onClick={() => navigator.clipboard?.writeText(questions.rows.filter(q => !q.answered).map((q, i) => `${i + 1}. ${q.text}`).join('\n'))}>Copy unanswered</button>
          <button className="btn" onClick={async () => { await sb.from('questions').insert(PREPARED_QA.map(([text]) => ({ text }))); questions.refetch() }}>Add the 7 prepared questions</button>
        </div>
        <details><summary>Prepared answers</summary>{PREPARED_QA.map(([q, a]) => <p key={q}><b>{q}</b><br />{a}</p>)}</details>
      </section>

      <section className="card"><h3>People</h3>
        <div className="people">{people.rows.map(p => <span key={p.id} className="chip">{p.name}<button onClick={async () => { await sb.from('participants').delete().eq('id', p.id); people.refetch() }}>✕</button></span>)}</div>
        <details><summary>Backup glow-up examples</summary>{GLOW.map(([b, a]) => <p key={b}><span className="neg">{b}</span><br /><span className="pos">{a}</span></p>)}</details>
        <button className="btn" onClick={async () => {
          if (!confirm('Delete ALL participants, votes, scores, rewrites, awards and questions?')) return
          // Deleting participants cascades to votes, rewrites, scores, awards and question votes.
          await sb.from('questions').delete().neq('id', ZERO)
          await sb.from('participants').delete().neq('id', ZERO)
          await setSession({ phase: 'lobby', step: 0, round: 'cv1', reveal: false, timer_end: null, message: null })
        }}>Reset everything</button>
      </section>
    </div>
  )
}

function Votes({ round }: { round: string }) {
  const votes = useRows<VoteRow>('votes', [['round', round]], 2000)
  const hire = votes.rows.filter(v => v.choice === 'hire').length
  return <section className="card"><h3>Votes, patient {round.replace('cv', '')}</h3><b className="pos">👍 {hire}</b> · <b className="neg">👎 {votes.rows.length - hire}</b></section>
}

function Picks({ round, people }: { round: string; people: Participant[] }) {
  const subs = useRows<SubmissionRow>('submissions', [['round', round]], 2000)
  const name = (id: string) => people.find(p => p.id === id)?.name ?? ''
  async function pick(s: SubmissionRow) {
    await sb.from('submissions').update({ picked: !s.picked }).eq('id', s.id)
    if (!s.picked) await sb.from('awards').insert({ participant_id: s.participant_id, points: 10, reason: 'Glow-up pick' })
    subs.refetch()
  }
  return (
    <section className="card"><h3>Rewrites ({subs.rows.length})</h3>
      {subs.rows.map(s => (
        <div key={s.id} className={`q ${s.picked ? 'picked' : ''}`}><div className="q-body"><div className="q-text">{s.content}</div><small className="faint">{name(s.participant_id)}</small></div>
          <button className={`btn ${s.picked ? 'btn-primary' : ''}`} onClick={() => pick(s)}>{s.picked ? 'Picked' : 'Pick +10'}</button></div>
      ))}
    </section>
  )
}

function Award({ people, board }: { people: Participant[]; board: { id: string; name: string; total: number }[] }) {
  const [who, setWho] = useState('')
  const [pts, setPts] = useState('1')
  const [why, setWhy] = useState('')
  const sorted = [...people].sort((a, b) => a.name.localeCompare(b.name))
  async function give() {
    const n = parseInt(pts, 10)
    if (!who || Number.isNaN(n)) return
    await sb.from('awards').insert({ participant_id: who, points: n, reason: why || null })
    setWhy('')
  }
  const total = board.find(b => b.id === who)?.total
  return (
    <section className="card"><h3>Award points</h3>
      <select className="input" value={who} onChange={e => setWho(e.target.value)}><option value="">Choose a person</option>{sorted.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <div className="row"><input className="input" type="number" value={pts} onChange={e => setPts(e.target.value)} style={{ maxWidth: 90 }} />
        <input className="input" placeholder="Reason (e.g. Correct diagnosis)" value={why} onChange={e => setWhy(e.target.value)} />
        <button className="btn btn-primary" disabled={!who} onClick={give}>Give</button></div>
      {who && total != null && <small className="faint">Currently {total} points</small>}
    </section>
  )
}
