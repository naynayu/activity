import { useMemo, useState } from 'react'
import { Board } from '../components/Board'
import { Questions } from '../components/Questions'
import { StatusDot } from '../components/Status'
import { HOST_PIN } from '../config'
import { STEPS, stepIndex, useContent } from '../content'
import { clock, serverNow, setSession, useCountdown, useSession } from '../data'
import { buildBoard } from '../scoring'
import { dbDelete, dbInsert, refreshAll, useTable } from '../store'
import { sb } from '../supabase'
import type { AwardRow, Participant, PhoneView, QuestionRow, ScoreRow, SessionRow, SubmissionRow, VoteRow } from '../types'
import { ContentEditor } from './ContentEditor'

const ZERO = '00000000-0000-0000-0000-000000000000'
const unlock = () => { try { sessionStorage.setItem('cv-host', '1') } catch { /* ignore */ } }

export function Host() {
  const [ok, setOk] = useState(() => { try { return sessionStorage.getItem('cv-host') === '1' } catch { return false } })
  const [pin, setPin] = useState('')
  const tryPin = () => { if (pin === HOST_PIN) { unlock(); setOk(true) } }
  if (ok) return <Console />
  return (
    <div className="phone" style={{ paddingTop: 80 }}>
      <div className="card card-lg">
        <h2>Host console</h2>
        <input className="input" type="password" inputMode="numeric" placeholder="PIN" value={pin} onChange={e => setPin(e.target.value)} onKeyDown={e => e.key === 'Enter' && tryPin()} />
        <button className="btn btn-primary btn-big" onClick={tryPin}>Open</button>
      </div>
    </div>
  )
}

function Console() {
  const s = useSession()
  const people = useTable<Participant>('participants').rows
  const scores = useTable<ScoreRow>('scores').rows
  const awards = useTable<AwardRow>('awards').rows
  const board = useMemo(() => buildBoard(people, scores, awards), [people, scores, awards])
  if (!s) return <div className="phone"><p>Loading…</p></div>

  const i = stepIndex(s.phase)
  const step = STEPS[i]
  const left = STEPS.slice(i).reduce((n, x) => n + x.minutes, 0)
  const go = (n: number) => {
    const t = STEPS[Math.max(0, Math.min(STEPS.length - 1, n))]
    setSession({
      phase: t.key, step: Math.max(s.step, n), reveal: false, timer_end: null,
      voting_open: false, submit_open: false, scores_open: t.key === 'score', questions_open: true,
      show_board: false, phone_view: 'auto',
    })
  }

  return (
    <div className="host">
      <header className="hostbar">
        <div><b>Host console</b> <StatusDot /><div className="faint small">{people.length} joined · {scores.length} scores sent · about {left} min left</div></div>
        <a className="btn" href="#screen" target="_blank" rel="noreferrer">Open projector</a>
      </header>

      <section className="card now">
        <div className="faint small">Step {i + 1} of {STEPS.length}</div>
        <h2 style={{ margin: '2px 0' }}>{step.title}</h2>
        <p className="muted" style={{ margin: '0 0 10px' }}>{step.say}</p>
        <div className="two">
          <button className="btn btn-big" disabled={i === 0} onClick={() => go(i - 1)}>← Back</button>
          <button className="btn btn-primary btn-big" disabled={i === STEPS.length - 1} onClick={() => go(i + 1)}>Next: {STEPS[Math.min(i + 1, STEPS.length - 1)].title} →</button>
        </div>
        <div className="chips">{STEPS.map((t, n) => <button key={t.key} className={`chip-btn ${n === i ? 'on' : n < s.step ? 'done' : ''}`} onClick={() => go(n)}>{n + 1}. {t.title}</button>)}</div>
      </section>

      {s.phase === 'vote' && <VoteControls s={s} />}
      {s.phase === 'rewrite' && <RewriteControls s={s} people={people} />}
      {s.phase === 'compare' && <Toggle label="Good CV" on={s.reveal} onLabel="Hide the good CV" offLabel="Reveal the good CV" set={v => setSession({ reveal: v })} />}
      {s.phase === 'score' && <>
        <Toggle label="Sending scores" on={s.scores_open} onLabel="Close scoring" offLabel="Open scoring" set={v => setSession({ scores_open: v })} />
        <section className="card"><b>{scores.length} of {people.length}</b> sent a score.<Board rows={board} limit={10} /></section></>}
      {s.phase === 'winners' && <>
        <Toggle label="Leaderboard" on={s.show_board} onLabel="Hide the leaderboard" offLabel="Reveal the leaderboard" set={v => setSession({ show_board: v })} />
        <section className="card"><h3>Leaderboard ({board.length})</h3><Board rows={board} limit={60} /></section></>}
      {s.phase === 'questions' && <QuestionControls s={s} />}

      <details className="card more"><summary>More controls</summary>
        <h3>Who can send right now</h3>
        <div className="gates">
          {([['voting_open', 'Votes'], ['submit_open', 'Rewrites'], ['scores_open', 'Scores'], ['questions_open', 'Questions']] as [keyof SessionRow, string][]).map(([k, l]) => (
            <button key={k} className={`btn ${s[k] ? 'btn-primary' : ''}`} onClick={() => setSession({ [k]: !s[k] })}>{l}: {s[k] ? 'Open' : 'Closed'}</button>
          ))}
        </div>
        <h3>What phones show</h3>
        <div className="gates">
          {([['auto', 'Follow the step'], ['hold', 'Eyes on screen'], ['winners', 'Leaderboard'], ['questions', 'Questions']] as [PhoneView, string][]).map(([k, l]) => (
            <button key={k} className={`btn ${s.phone_view === k ? 'btn-primary' : ''}`} onClick={() => setSession({ phone_view: k })}>{l}</button>
          ))}
        </div>
        <Banner s={s} />
        <Award people={people} board={board} />
        <h3>People ({people.length})</h3>
        <div className="people">{people.map(p => <span key={p.id} className="chip">{p.name}<button onClick={() => dbDelete('participants', { id: p.id })}>✕</button></span>)}</div>
      </details>

      <details className="card more"><summary>Edit the content</summary><ContentEditor /></details>

      <details className="card more"><summary>Start over</summary>
        <p className="muted">Deletes every person, vote, rewrite, score, award and question, and goes back to Welcome.</p>
        <button className="btn" onClick={async () => {
          if (!confirm('Delete everything and start over?')) return
          await sb.from('questions').delete().neq('id', ZERO)
          await sb.from('participants').delete().neq('id', ZERO)
          await setSession({ phase: 'welcome', step: 0, round: 'cv1', reveal: false, timer_end: null, message: null, voting_open: false, submit_open: false, scores_open: false, questions_open: true, show_board: false, phone_view: 'auto' })
          refreshAll()
        }}>Reset everything</button>
      </details>
    </div>
  )
}

function Toggle({ label, on, onLabel, offLabel, set }: { label: string; on: boolean; onLabel: string; offLabel: string; set: (v: boolean) => void }) {
  return <section className="card"><div className="row"><span>{label}: <b>{on ? 'showing' : 'hidden'}</b></span>
    <button className="btn btn-primary" onClick={() => set(!on)}>{on ? onLabel : offLabel}</button></div></section>
}

const timer = (sec: number | null) => ({ timer_end: sec == null ? null : new Date(serverNow() + sec * 1000).toISOString() })

function VoteControls({ s }: { s: SessionRow }) {
  const votes = useTable<VoteRow>('votes').rows.filter(v => v.round === s.round)
  const left = useCountdown(s.timer_end)
  const patient = Number(s.round.replace('cv', '')) || 1
  const hire = votes.filter(v => v.choice === 'hire').length
  return (
    <section className="card">
      <div className="row"><b>Patient {patient}</b><span><b className="pos">👍 {hire}</b> · <b className="neg">👎 {votes.length - hire}</b></span></div>
      <button className="btn btn-primary btn-big" onClick={() => setSession({ ...timer(6), voting_open: true })}>Show the CV for 6 seconds {left ? `(${left})` : ''}</button>
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn" onClick={() => setSession({ voting_open: !s.voting_open })}>{s.voting_open ? 'Close voting' : 'Open voting'}</button>
        <button className="btn" onClick={() => setSession({ round: `cv${patient + 1}`, ...timer(null), voting_open: false })}>Next patient →</button>
      </div>
    </section>
  )
}

function RewriteControls({ s, people }: { s: SessionRow; people: Participant[] }) {
  const subs = useTable<SubmissionRow>('submissions').rows.filter(x => x.round === s.round)
  const left = useCountdown(s.timer_end)
  const [line, setLine] = useState(s.weak_line ?? '')
  const name = (id: string) => people.find(p => p.id === id)?.name ?? ''
  async function pick(x: SubmissionRow) {
    await sb.from('submissions').update({ picked: !x.picked }).eq('id', x.id)
    if (!x.picked) await dbInsert('awards', [{ id: crypto.randomUUID(), participant_id: x.participant_id, points: 10, reason: 'Rewrite pick', created_at: new Date().toISOString() }])
  }
  return (
    <section className="card">
      <h3>The weak line</h3>
      <div className="row"><input className="input" value={line} onChange={e => setLine(e.target.value)} placeholder="Type the weak line from this patient’s CV" />
        <button className="btn" onClick={() => setSession({ weak_line: line.trim() || null })}>Show it</button></div>
      <div className="row">
        <button className="btn btn-primary" onClick={() => setSession({ ...timer(60), submit_open: true })}>Start 60 seconds {left != null ? `(${clock(left)})` : ''}</button>
        <button className="btn" onClick={() => setSession({ ...timer(null), submit_open: false })}>Stop and close</button>
      </div>
      <h3>Rewrites ({subs.length})</h3>
      {subs.map(x => (
        <div key={x.id} className={`q ${x.picked ? 'picked' : ''}`}><div className="q-body"><div className="q-text">{x.content}</div><small className="faint">{name(x.participant_id)}</small></div>
          <button className={`btn ${x.picked ? 'btn-primary' : ''}`} onClick={() => pick(x)}>{x.picked ? 'Picked' : 'Pick +10'}</button></div>
      ))}
    </section>
  )
}

function QuestionControls({ s }: { s: SessionRow }) {
  const c = useContent()
  const qs = useTable<QuestionRow>('questions').rows
  return (
    <section className="card">
      <div className="row"><b>{qs.filter(q => !q.answered).length} to answer</b>
        <button className="btn" onClick={() => setSession({ questions_open: !s.questions_open })}>{s.questions_open ? 'Close questions' : 'Open questions'}</button></div>
      <Questions mode="host" />
      <div className="row">
        <button className="btn" onClick={() => navigator.clipboard?.writeText(qs.filter(q => !q.answered).map((q, n) => `${n + 1}. ${q.text}`).join('\n'))}>Copy the unanswered ones</button>
        <button className="btn" onClick={() => dbInsert('questions', c.qa.map(([text]) => ({ id: crypto.randomUUID(), text, answered: false, created_at: new Date().toISOString() })))}>Add the prepared questions</button>
      </div>
      <details><summary>Prepared answers</summary>{c.qa.map(([q, a]) => <p key={q}><b>{q}</b><br />{a}</p>)}</details>
    </section>
  )
}

function Banner({ s }: { s: SessionRow }) {
  const [msg, setMsg] = useState(s.message ?? '')
  return (<>
    <h3>Message on every screen</h3>
    <div className="row"><input className="input" value={msg} onChange={e => setMsg(e.target.value)} placeholder="e.g. Back in 5 minutes" />
      <button className="btn" onClick={() => setSession({ message: msg.trim() || null })}>Show</button>
      <button className="btn" onClick={() => { setMsg(''); setSession({ message: null }) }}>Clear</button></div>
  </>)
}

function Award({ people, board }: { people: Participant[]; board: { id: string; total: number }[] }) {
  const [who, setWho] = useState('')
  const [pts, setPts] = useState('1')
  const [why, setWhy] = useState('')
  const sorted = [...people].sort((a, b) => a.name.localeCompare(b.name))
  const n = parseInt(pts, 10)
  return (<>
    <h3>Give points</h3>
    <select className="input" value={who} onChange={e => setWho(e.target.value)}><option value="">Choose a person</option>{sorted.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
    <div className="row"><input className="input" type="number" value={pts} onChange={e => setPts(e.target.value)} style={{ maxWidth: 90 }} />
      <input className="input" placeholder="Reason (optional)" value={why} onChange={e => setWhy(e.target.value)} />
      <button className="btn btn-primary" disabled={!who || Number.isNaN(n)} onClick={() => { dbInsert('awards', [{ id: crypto.randomUUID(), participant_id: who, points: n, reason: why || null, created_at: new Date().toISOString() }]); setWhy('') }}>Give</button></div>
    {who && <small className="faint">Currently {board.find(b => b.id === who)?.total ?? 0} points</small>}
  </>)
}

