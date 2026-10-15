import { useEffect, useMemo, useRef, useState } from 'react'
import { Board } from '../components/Board'
import { CvView, useCv } from '../components/PatientCv'
import { Questions } from '../components/Questions'
import { Scorecard, type Card } from '../components/Scorecard'
import { StatusDot } from '../components/Status'
import { STEPS, stepIndex, useContent } from '../content'
import { clock, useCountdown, useSession } from '../data'
import { buildBoard, computeScore } from '../scoring'
import { dbInsert, dbUpsert, useTable } from '../store'
import type { AwardRow, Participant as P, ScoreRow, SessionRow, SubmissionRow, VoteRow } from '../types'

export function Participant({ me, onLeave }: { me: P; onLeave: () => void }) {
  const s = useSession()
  const [ask, setAsk] = useState(false)
  if (!s) return <div className="phone"><div className="skel" style={{ height: 140, marginTop: 80 }} /></div>
  const step = STEPS[stepIndex(s.phase)]
  const view = ask ? 'questions' : s.phone_view !== 'auto' ? s.phone_view : null

  return (
    <div className="phone">
      <header className="phone-head">
        <div><b>{me.name}</b> <StatusDot /></div>
        <button className="btn" onClick={onLeave}>Leave</button>
      </header>
      {s.message && <div className="banner">{s.message}</div>}
      {view === 'hold' && <div className="card card-lg center"><div className="logo">👀</div><h2>Eyes on the screen</h2></div>}
      {view === 'winners' && <Winners me={me} s={s} />}
      {view === 'questions' && <><h2>Questions</h2><Questions mode="phone" me={me} open={s.questions_open} /></>}
      {!view && (
        <>
          <h2>{step.title}</h2>
          <p className="say">{step.say}</p>
          {s.phase === 'vote' && <Vote me={me} s={s} />}
          {s.phase === 'rewrite' && <Rewrite me={me} s={s} />}
          {s.phase === 'compare' && <Compare s={s} />}
          {s.phase === 'score' && <Score me={me} s={s} />}
          {s.phase === 'winners' && <Winners me={me} s={s} />}
          {s.phase === 'questions' && <Questions mode="phone" me={me} open={s.questions_open} />}
        </>
      )}
      <nav className="tabbar">
        <button className={!ask ? 'on' : ''} onClick={() => setAsk(false)}>Now</button>
        <button className={ask ? 'on' : ''} onClick={() => setAsk(true)}>Ask a question</button>
      </nav>
    </div>
  )
}

const Closed = ({ text }: { text: string }) => <div className="card center muted">🔒 {text}</div>

function Vote({ me, s }: { me: P; s: SessionRow }) {
  const votes = useTable<VoteRow>('votes').rows.filter(v => v.round === s.round)
  const cv = useCv(s.round, `${s.reveal}`)
  const [err, setErr] = useState('')
  const mine = votes.find(v => v.participant_id === me.id)?.choice
  async function vote(choice: 'hire' | 'pass') {
    setErr('')
    const r = await dbUpsert('votes', { participant_id: me.id, round: s.round, choice })
    if (!r.ok) setErr('Voting is closed.')
  }
  const hire = votes.filter(v => v.choice === 'hire').length, pass = votes.length - hire
  return (
    <>
      {s.reveal ? (
        <>
          <div className="muted small">Patient {s.round.replace('cv', '')}</div>
          <CvView cv={cv} />
        </>
      ) : (
        <div className="card center">
          <div className="muted">Patient {s.round.replace('cv', '')}</div>
          <div className="big">Get ready</div>
          <p className="muted small">The CV appears here when the host shows it.</p>
        </div>
      )}
      <div className="two">
        <button className={`btn btn-big vote ${mine === 'hire' ? 'btn-primary' : ''}`} disabled={!s.voting_open} onClick={() => vote('hire')}>👍 Hire</button>
        <button className={`btn btn-big vote ${mine === 'pass' ? 'btn-primary' : ''}`} disabled={!s.voting_open} onClick={() => vote('pass')}>👎 Pass</button>
      </div>
      {mine && <p className="center muted">You voted {mine}.{s.voting_open ? ' You can change it.' : ''}</p>}
      {!s.voting_open && s.reveal && !mine && <p className="center muted">🔒 Voting is closed.</p>}
      {err && <p className="center neg">{err}</p>}
      {(mine || !s.voting_open) && votes.length > 0 && <div className="card center"><b className="pos">👍 {hire}</b> &nbsp;·&nbsp; <b className="neg">👎 {pass}</b><div className="muted small">{votes.length} votes so far</div></div>}
    </>
  )
}

function Rewrite({ me, s }: { me: P; s: SessionRow }) {
  const all = useTable<SubmissionRow>('submissions').rows.filter(x => x.round === s.round)
  const subs = all.filter(x => x.participant_id === me.id)
  const best = all.filter(x => x.picked)
  const people = useTable<P>('participants').rows
  const cv = useCv(s.round, 'rewrite')
  const left = useCountdown(s.timer_end)
  const [text, setText] = useState('')
  const [err, setErr] = useState('')
  const open = s.submit_open && (left == null || left > 0)
  async function send() {
    const t = text.trim()
    if (!t) return
    setErr('')
    const r = await dbInsert('submissions', [{ id: crypto.randomUUID(), participant_id: me.id, round: s.round, content: t, picked: false, created_at: new Date().toISOString() }])
    if (r.ok) setText(''); else setErr('Time is up, or the host has closed this.')
  }
  return (
    <>
      <div className="card center"><div className="muted">Rewrite this line</div><h3 style={{ margin: '6px 0' }}>“{s.weak_line || 'The host will show the line'}”</h3>
        {left != null && <div className="big">{clock(left)}</div>}</div>
      <details open><summary>The CV</summary><CvView cv={cv} /></details>
      {!open && <Closed text={left === 0 ? 'Time is up.' : 'Opens when the host starts the timer.'} />}
      <div className="card">
        <textarea className="input" rows={4} maxLength={400} disabled={!open} placeholder="Example: Managed 300+ client files and cut search time from 15 minutes to under 5." value={text} onChange={e => setText(e.target.value)} />
        {err && <p className="neg small">{err}</p>}
        <button className="btn btn-primary btn-big" disabled={!text.trim() || !open} onClick={send}>Send my rewrite</button>
      </div>
      {subs.map(x => <div key={x.id} className={`card ${x.picked ? 'picked' : ''}`}>{x.content}{x.picked && <div className="pos small">Picked by the host 🎉</div>}</div>)}
      {best.length > 0 && <><h3>Best rewrites 🎉</h3>{best.map(x => <div key={x.id} className="card picked">{x.content}<div className="faint small">{x.example ? 'Example' : people.find(p => p.id === x.participant_id)?.name}</div></div>)}</>}
    </>
  )
}

function Compare({ s }: { s: SessionRow }) {
  const c = useContent()
  return (
    <>
      <h3 className="neg">The bad CV</h3><pre className="cv">{c.bad.text}</pre>
      {s.reveal
        ? <><h3 className="pos">The good CV</h3><pre className="cv">{c.good.text}</pre>
            {c.notes.map(([b, g]) => <div key={b} className="card"><div className="neg small">{b}</div><div className="pos">{g}</div></div>)}</>
        : <p className="center muted">The good CV appears when the host reveals it.</p>}
    </>
  )
}

function Score({ me, s }: { me: P; s: SessionRow }) {
  const c = useContent()
  const saved = useTable<ScoreRow>('scores').rows.find(r => r.participant_id === me.id)
  const [card, setCard] = useState<Card>({ checks: [], deds: [], typos: 0 })
  const [err, setErr] = useState('')
  const loaded = useRef(false)
  useEffect(() => { if (saved && !loaded.current) { loaded.current = true; setCard({ checks: saved.checks, deds: saved.deds, typos: saved.typos }) } }, [saved])
  const total = computeScore(card.checks, card.deds, card.typos, c)
  async function submit() {
    setErr('')
    const r = await dbUpsert('scores', { participant_id: me.id, score: total, checks: card.checks, deds: card.deds, typos: card.typos, updated_at: new Date().toISOString() })
    if (!r.ok) setErr('Scores are closed.')
  }
  return (
    <>
      {!s.scores_open && <Closed text="You can send your score when the host opens it. You can still tick things now." />}
      <Scorecard card={card} onChange={setCard} />
      {err && <p className="center neg">{err}</p>}
      <div className="submitbar">
        <button className="btn btn-primary btn-big" disabled={!s.scores_open} onClick={submit}>
          {saved ? (saved.score === total ? `Sent: ${saved.score} ✓` : `Update my score to ${total}`) : `Send my score: ${total}`}
        </button>
      </div>
    </>
  )
}

function Winners({ me, s }: { me: P; s: SessionRow }) {
  const people = useTable<P>('participants').rows
  const scores = useTable<ScoreRow>('scores').rows
  const awards = useTable<AwardRow>('awards').rows
  const rows = useMemo(() => buildBoard(people, scores, awards), [people, scores, awards])
  if (!s.show_board) return <div className="card card-lg center"><div className="logo">🥁</div><h2>Winners coming up</h2><p className="muted">The host will reveal the leaderboard.</p></div>
  const mine = rows.find(r => r.id === me.id)
  return (
    <>
      {mine ? <div className="card center"><div className="big">#{mine.rank}</div><div className="muted">{mine.total} points · {rows.length} players</div></div>
        : <p className="muted">Send your score to join the leaderboard.</p>}
      <Board rows={rows} meId={me.id} limit={10} />
    </>
  )
}
