import QRCode from 'qrcode'
import { useEffect, useMemo, useState } from 'react'
import { Board } from '../components/Board'
import { maskContacts, shrinkImage, useCv } from '../components/PatientCv'
import { Questions } from '../components/Questions'
import { StatusDot } from '../components/Status'
import { HOST_PIN } from '../config'
import { STEPS, stepIndex, useContent } from '../content'
import { clock, serverNow, setSession, useCountdown, useSession } from '../data'
import { buildBoard } from '../scoring'
import { dbDelete, dbInsert, refreshAll, useTable } from '../store'
import { sb } from '../supabase'
import type { AnswerRow, AwardRow, Participant, PhoneView, QuestionRow, ScoreRow, SessionRow, SubmissionRow, VoteRow } from '../types'
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
  const answers = useTable<AnswerRow>('answers').rows
  const c = useContent()
  const board = useMemo(() => buildBoard(people, scores, awards, answers, c), [people, scores, awards, answers, c])
  const [share, setShare] = useState(false)
  if (!s) return <div className="phone"><p>Loading…</p></div>

  const i = stepIndex(s.phase)
  const step = STEPS[i]
  const left = STEPS.slice(i).reduce((n, x) => n + x.minutes, 0)
  const go = (n: number) => {
    const t = STEPS[Math.max(0, Math.min(STEPS.length - 1, n))]
    setSession({
      phase: t.key, step: Math.max(s.step, n), reveal: false, timer_end: null,
      voting_open: false, submit_open: false, scores_open: t.key === 'score', questions_open: true,
      quiz_open: false, quiz_reveal: false, show_board: false, phone_view: 'auto',
    })
  }

  return (
    <div className="host">
      <header className="hostbar">
        <div><b>Host console</b> <StatusDot /><div className="faint small">{people.length} joined · {scores.length} scores sent · about {left} min left</div></div>
        <button className="btn" onClick={() => setShare(v => !v)}>{share ? 'Hide' : 'Share the link'}</button>
      </header>

      {share && <ShareCard />}

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
      {s.phase === 'quiz' && <QuizControls s={s} people={people} answers={answers} />}

      <details className="card more"><summary>More controls</summary>
        <h3>Who can send right now</h3>
        <div className="gates">
          {([['voting_open', 'Votes'], ['submit_open', 'Rewrites'], ['scores_open', 'Scores'], ['quiz_open', 'Quiz'], ['questions_open', 'Questions']] as [keyof SessionRow, string][]).map(([k, l]) => (
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

      <details className="card more"><summary>Questions from the room</summary><QuestionControls s={s} /></details>

      <details className="card more"><summary>Edit the content</summary><ContentEditor /></details>

      <details className="card more"><summary>Start over</summary>
        <p className="muted">Deletes every person, vote, rewrite, score, award and question, and goes back to Welcome.</p>
        <button className="btn" onClick={async () => {
          if (!confirm('Delete everything and start over?')) return
          await sb.from('questions').delete().neq('id', ZERO)
          await sb.from('participants').delete().neq('id', ZERO)
          await setSession({ phase: 'welcome', step: 0, round: 'cv1', reveal: false, timer_end: null, message: null, voting_open: false, submit_open: false, scores_open: false, questions_open: true, quiz_open: false, quiz_reveal: false, show_board: false, phone_view: 'auto' })
          refreshAll()
        }}>Reset everything</button>
      </details>
    </div>
  )
}

function ShareCard() {
  const url = location.origin + location.pathname
  const [qr, setQr] = useState('')
  useEffect(() => { QRCode.toDataURL(url, { margin: 1, width: 360 }).then(setQr) }, [url])
  return (
    <section className="card center">
      <h3>Join link</h3>
      {qr && <img src={qr} alt="QR code" style={{ width: 240, borderRadius: 12, background: '#fff', padding: 6 }} />}
      <p><b>{url}</b></p>
      <button className="btn btn-primary" onClick={() => navigator.clipboard?.writeText(url)}>Copy the link</button>
      <p className="muted small">Paste it in the WhatsApp group, or show this code on your phone for people to scan.</p>
    </section>
  )
}

function Toggle({ label, on, onLabel, offLabel, set }: { label: string; on: boolean; onLabel: string; offLabel: string; set: (v: boolean) => void }) {
  return <section className="card"><div className="row"><span>{label}: <b>{on ? 'showing' : 'hidden'}</b></span>
    <button className="btn btn-primary" onClick={() => set(!on)}>{on ? onLabel : offLabel}</button></div></section>
}

const timer = (sec: number | null) => ({ timer_end: sec == null ? null : new Date(serverNow() + sec * 1000).toISOString() })

function CvSlot({ round }: { round: string }) {
  const c = useContent()
  const saved = useCv(round, 'host')
  const [text, setText] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [hide, setHide] = useState(true)
  const [msg, setMsg] = useState('')
  const n = Number(round.replace('cv', '')) || 1
  const note = c.samples[n - 1]?.note
  async function loadAll() {
    const rows = c.samples.map((x, i) => ({ round: `cv${i + 1}`, text: x.text, image: null, updated_at: new Date().toISOString() }))
    const { error } = await sb.from('cvs').upsert(rows)
    if (!error) { setSession({ weak_line: c.samples[n - 1]?.weak ?? c.samples[0].weak }); setText(c.samples[n - 1]?.text ?? ''); setImage(null) }
    setMsg(error ? 'Could not load them.' : `Loaded ${rows.length} sample CVs. Patient ${n} is ready. “Next patient” moves to the next one.`)
  }
  async function save() {
    const body = image ? null : (hide ? maskContacts(text) : text).trim() || null
    const { error } = await sb.from('cvs').upsert({ round, text: body, image, updated_at: new Date().toISOString() })
    setMsg(error ? 'Could not save.' : 'Saved. Every phone shows it when you press Show.')
  }
  return (
    <section className="card">
      <h3>This patient’s CV</h3>
      <p className="muted small">Paste the text, or add a photo or screenshot. Nothing shows on any phone until you press “Show the CV”. It then stays on screen through Hire or Pass and Fix the line.</p>
      <textarea className="input" rows={6} placeholder="Paste the CV text here" value={text} disabled={!!image} onChange={e => { setText(e.target.value); setMsg('') }} />
      <label className="opt" style={{ border: 0 }}><input type="checkbox" checked={hide} onChange={e => setHide(e.target.checked)} /><span>Hide phone numbers and emails in pasted text</span></label>
      <div className="row">
        <label className="btn">📷 Add a photo or screenshot<input type="file" accept="image/*" hidden onChange={async e => { const f = e.target.files?.[0]; if (f) { setImage(await shrinkImage(f)); setMsg('') } }} /></label>
        <select className="input" style={{ maxWidth: 260, margin: 0 }} value="" onChange={e => { const x = c.samples[Number(e.target.value)]; if (x) { setText(x.text); setImage(null); setMsg('') } }}>
          <option value="">Load a sample CV…</option>{c.samples.map((x, n) => <option key={x.name} value={n}>{n + 1}. {x.name}</option>)}</select>
        {image && <button className="btn" onClick={() => setImage(null)}>Remove photo</button>}
      </div>
      {image && <><img className="cv-img" style={{ maxHeight: 220, width: 'auto' }} src={image} alt="Preview" /><p className="neg small">Photos are not masked. Cover phone numbers, emails and addresses before taking the photo.</p></>}
      <button className="btn btn-primary btn-big" disabled={!text.trim() && !image} onClick={save}>Save this CV</button>
      <button className="btn btn-big" onClick={loadAll}>Load all {c.samples.length} sample CVs as patients 1 to {c.samples.length}</button>
      {note && <p className="host-note"><b>Host note:</b> {note}</p>}
      {msg && <p className="pos small">{msg}</p>}
      {saved && (saved.text || saved.image) && !msg && <p className="muted small">A CV is saved for patient {round.replace('cv', '')}.</p>}
    </section>
  )
}

function VoteControls({ s }: { s: SessionRow }) {
  const c = useContent()
  const votes = useTable<VoteRow>('votes').rows.filter(v => v.round === s.round)
  const patient = Number(s.round.replace('cv', '')) || 1
  const hire = votes.filter(v => v.choice === 'hire').length
  return (
    <>
    <CvSlot round={s.round} />
    <section className="card">
      <div className="row"><b>Patient {patient}</b><span><b className="pos">👍 {hire}</b> · <b className="neg">👎 {votes.length - hire}</b></span></div>
      <button className="btn btn-primary btn-big" onClick={() => setSession({ reveal: true, voting_open: true })}>Show the CV to everyone and open voting</button>
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn" onClick={() => setSession({ voting_open: !s.voting_open })}>{s.voting_open ? 'Close voting' : 'Open voting'}</button>
        <button className="btn" onClick={() => setSession({ reveal: !s.reveal })}>{s.reveal ? 'Hide the CV' : 'Show the CV only'}</button>
        <button className="btn" onClick={() => setSession({ round: `cv${patient + 1}`, ...timer(null), voting_open: false, reveal: false, ...(c.samples[patient] ? { weak_line: c.samples[patient].weak } : {}) })}>Next patient →</button>
      </div>
    </section>
    </>
  )
}

function RewriteControls({ s, people }: { s: SessionRow; people: Participant[] }) {
  const c = useContent()
  const subs = useTable<SubmissionRow>('submissions').rows.filter(x => x.round === s.round)
  const real = subs.filter(x => !x.example)
  const examples = subs.filter(x => x.example)
  const patient = Number(s.round.replace('cv', '')) || 1
  const mine = c.samples[patient - 1]
  const left = useCountdown(s.timer_end)
  const [line, setLine] = useState(s.weak_line ?? '')
  const name = (id: string | null) => (id ? people.find(p => p.id === id)?.name ?? '' : 'Example')
  async function pick(x: SubmissionRow) {
    await sb.from('submissions').update({ picked: !x.picked }).eq('id', x.id)
    if (!x.picked && x.participant_id) await dbInsert('awards', [{ id: crypto.randomUUID(), participant_id: x.participant_id, points: 10, reason: 'Rewrite pick', created_at: new Date().toISOString() }])
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
      <h3>Rewrites ({real.length})</h3>
      {real.length === 0 && <p className="muted">No rewrites yet. They appear here as people send them.</p>}
      {real.map(x => (
        <div key={x.id} className={`q ${x.picked ? 'picked' : ''}`}><div className="q-body"><div className="q-text">{x.content}</div><small className="faint">{name(x.participant_id)}</small></div>
          <button className={`btn ${x.picked ? 'btn-primary' : ''}`} onClick={() => pick(x)}>{x.picked ? 'Picked' : 'Pick +10'}</button></div>
      ))}
      <h3>Example rewrites</h3>
      <p className="muted small">For when the room is quiet. They show on every phone, marked as examples.</p>
      {mine
        ? <div className="row">
            <button className="btn" disabled={examples.length > 0} onClick={() => dbInsert('submissions', mine.rewrites.map(content => ({ id: crypto.randomUUID(), participant_id: null, round: s.round, content, picked: true, example: true, created_at: new Date().toISOString() })))}>Show {mine.rewrites.length} example rewrites to everyone</button>
            {examples.length > 0 && <button className="btn" onClick={() => dbDelete('submissions', { round: s.round, example: true })}>Remove the examples</button>}
          </div>
        : <p className="muted small">No examples for this patient. Add your own on the “Edit the content” panel, or pick the best real rewrite.</p>}
      {examples.map(x => <div key={x.id} className="q picked"><div className="q-body"><div className="q-text">{x.content}</div><small className="faint">Example</small></div></div>)}
    </section>
  )
}

function QuizControls({ s, people, answers }: { s: SessionRow; people: Participant[]; answers: AnswerRow[] }) {
  const c = useContent()
  const done = people.filter(p => answers.filter(a => a.participant_id === p.id).length >= c.quiz.length).length
  const hit = (q: number) => answers.filter(a => a.q === q)
  async function reset() {
    if (!confirm('Clear every answer and start the quiz again?')) return
    await sb.from('answers').delete().neq('q', -1)
    await setSession({ quiz_open: false, quiz_reveal: false })
    refreshAll()
  }
  return (
    <section className="card">
      <div className="row"><b>{done} of {people.length} finished all {c.quiz.length}</b><span className="muted small">{answers.length} answers in</span></div>
      <div className="row">
        <button className={`btn ${s.quiz_open ? '' : 'btn-primary'}`} onClick={() => setSession({ quiz_open: !s.quiz_open })}>{s.quiz_open ? 'Close the quiz' : 'Open the quiz'}</button>
        <button className={`btn ${s.quiz_reveal ? '' : 'btn-primary'}`} onClick={() => setSession({ quiz_reveal: !s.quiz_reveal, quiz_open: false })}>{s.quiz_reveal ? 'Hide the answers' : 'Close and reveal the answers'}</button>
        <button className="btn" onClick={reset}>Reset the quiz</button>
      </div>
      <h3>How the room is doing</h3>
      {c.quiz.map((item, i) => {
        const a = hit(i), right = a.filter(x => x.choice === item.answer).length
        return <div key={i} className="row small" style={{ marginBottom: 2 }}><span>{i + 1}. {item.q}</span><b className={a.length && right / a.length < 0.5 ? 'neg' : 'pos'}>{a.length ? `${Math.round((100 * right) / a.length)}% right` : '–'}</b></div>
      })}
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

