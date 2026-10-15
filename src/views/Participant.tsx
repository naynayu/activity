import { useEffect, useMemo, useRef, useState } from 'react'
import { Board } from '../components/Board'
import { Questions } from '../components/Questions'
import { Scorecard, type Card } from '../components/Scorecard'
import { BAD_EA, COMPARE_NOTES, GOOD_EA, PHASES, SAMPLE_CHK, SAMPLE_DED, SAMPLE_TYPOS, SYMPTOMS, phaseIndex } from '../content'
import { clock, useCountdown, useRows, useSession } from '../data'
import { buildBoard, computeScore } from '../scoring'
import { sb } from '../supabase'
import type { AwardRow, Participant as P, ScoreRow, SubmissionRow, VoteRow } from '../types'

type Tab = 'now' | 'qa' | 'board'

export function Participant({ me, onLeave }: { me: P; onLeave: () => void }) {
  const { session } = useSession()
  const [tab, setTab] = useState<Tab>('now')
  if (!session) return <div className="phone"><div className="skel" style={{ height: 120, marginTop: 80 }} /></div>
  const info = PHASES[Math.max(0, phaseIndex(session.phase))]

  return (
    <div className="phone">
      <header className="phone-head">
        <div><b>{me.name}</b><div className="faint small">{info.title}</div></div>
        <button className="btn" onClick={onLeave}>Leave</button>
      </header>
      {session.message && <div className="banner">{session.message}</div>}
      {tab === 'now' && <Now me={me} />}
      {tab === 'qa' && <><h2>Questions</h2><Questions mode="phone" me={me} /></>}
      {tab === 'board' && <BoardTab me={me} />}
      <nav className="tabbar">
        {([['now', 'Now'], ['qa', 'Questions'], ['board', 'Board']] as [Tab, string][]).map(([k, l]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
        ))}
      </nav>
    </div>
  )
}

function BoardTab({ me }: { me: P }) {
  const people = useRows<P>('participants', [], 10000)
  const scores = useRows<ScoreRow>('scores')
  const awards = useRows<AwardRow>('awards')
  const rows = useMemo(() => buildBoard(people.rows, scores.rows, awards.rows), [people.rows, scores.rows, awards.rows])
  const mine = rows.find(r => r.id === me.id)
  return (
    <>
      <h2>Leaderboard</h2>
      {mine ? <div className="card center"><div className="big">#{mine.rank}</div><div className="muted">{mine.total} points · {rows.length} players</div></div>
        : <p className="muted">Submit your scorecard to join the leaderboard.</p>}
      <Board rows={rows} meId={me.id} limit={10} />
    </>
  )
}

function Now({ me }: { me: P }) {
  const { session } = useSession()
  if (!session) return null
  switch (session.phase) {
    case 'hirepass': return <HirePass me={me} />
    case 'diagnosis': return <Diagnosis />
    case 'glowup': return <GlowUp me={me} />
    case 'practice': return <Practice />
    case 'compare': return <Compare />
    case 'scorecard': return <ScoreGame me={me} />
    case 'leaderboard': return <BoardTab me={me} />
    case 'qa': return <><h2>Questions</h2><Questions mode="phone" me={me} /></>
    default: return <div className="card card-lg center"><div className="logo">🩺</div><h2>Welcome to the CV Clinic</h2><p className="muted">Hang tight. The host will start the next round. You can ask a question any time from the Questions tab.</p></div>
  }
}

function HirePass({ me }: { me: P }) {
  const { session } = useSession()
  const round = session?.round ?? 'cv1'
  const votes = useRows<VoteRow>('votes', [['round', round], ['participant_id', me.id]], 4000)
  const left = useCountdown(session?.timer_end)
  const mine = votes.rows[0]?.choice
  async function vote(choice: 'hire' | 'pass') {
    await sb.from('votes').upsert({ participant_id: me.id, round, choice })
    votes.refetch()
  }
  const showing = !!session?.reveal && left != null && left > 0
  return (
    <>
      <h2>Hire or Pass</h2>
      <div className="card center">
        <div className="muted">{round.replace('cv', 'Patient ')}</div>
        <div className="big">{showing ? left : session?.reveal ? 'Vote now' : 'Get ready'}</div>
        <p className="muted small">You get 6 seconds to skim. Then decide.</p>
      </div>
      <div className="two">
        <button className={`btn btn-big vote ${mine === 'hire' ? 'btn-primary' : ''}`} onClick={() => vote('hire')}>👍 Hire</button>
        <button className={`btn btn-big vote ${mine === 'pass' ? 'btn-primary' : ''}`} onClick={() => vote('pass')}>👎 Pass</button>
      </div>
      {mine && <p className="center muted">Voted {mine}. You can change it.</p>}
    </>
  )
}

function Diagnosis() {
  return (
    <>
      <h2>The Diagnosis</h2>
      <p className="muted">Spot the symptoms on screen and shout them out.</p>
      {SYMPTOMS.map(([n, m, c]) => (
        <div key={n} className="card"><b>{n}</b><div className="muted">{m}</div><div className="pos small">Cure: {c}</div></div>
      ))}
    </>
  )
}

function GlowUp({ me }: { me: P }) {
  const { session } = useSession()
  const round = session?.round ?? 'cv1'
  const subs = useRows<SubmissionRow>('submissions', [['participant_id', me.id], ['round', round]], 5000)
  const left = useCountdown(session?.timer_end)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  async function send() {
    const t = text.trim()
    if (!t || busy) return
    setBusy(true)
    await sb.from('submissions').insert({ participant_id: me.id, round, content: t })
    setText(''); setBusy(false); subs.refetch()
  }
  return (
    <>
      <h2>The Glow-Up</h2>
      <div className="card center"><div className="big">{left == null ? '60s' : clock(left)}</div><p className="muted">Rewrite the weakest bullet with a result and a number.</p></div>
      <div className="card">
        <textarea className="input" rows={4} maxLength={400} placeholder="Managed filing for 300+ client records and cut retrieval time from 15 minutes to under 5." value={text} onChange={e => setText(e.target.value)} />
        <button className="btn btn-primary btn-big" disabled={!text.trim() || busy} onClick={send}>Submit rewrite</button>
      </div>
      {subs.rows.map(s => <div key={s.id} className={`card ${s.picked ? 'picked' : ''}`}>{s.content}{s.picked && <div className="pos small">Picked by the host 🎉</div>}</div>)}
    </>
  )
}

function Practice() {
  const { session } = useSession()
  const [card, setCard] = useState<Card>({ checks: [], deds: [], typos: 0 })
  const answer = computeScore(SAMPLE_CHK, SAMPLE_DED, SAMPLE_TYPOS)
  return (
    <>
      <h2>Practice: score Seun’s CV</h2>
      <p className="muted">Look at the screen. This one is not saved.</p>
      {session?.reveal && <div className="card tone-warn center"><b>The room’s answer: {answer}</b><div className="muted small">5 points earned, 17 red flags × −5</div></div>}
      <Scorecard card={card} onChange={setCard} />
    </>
  )
}

function ScoreGame({ me }: { me: P }) {
  const saved = useRows<ScoreRow>('scores', [['participant_id', me.id]], 5000)
  const [card, setCard] = useState<Card>({ checks: [], deds: [], typos: 0 })
  const [busy, setBusy] = useState(false)
  const loaded = useRef(false)
  const row = saved.rows[0]
  useEffect(() => {
    if (row && !loaded.current) { loaded.current = true; setCard({ checks: row.checks, deds: row.deds, typos: row.typos }) }
  }, [row])
  const total = computeScore(card.checks, card.deds, card.typos)
  async function submit() {
    setBusy(true)
    await sb.from('scores').upsert({ participant_id: me.id, score: total, checks: card.checks, deds: card.deds, typos: card.typos, updated_at: new Date().toISOString() })
    saved.refetch(); setBusy(false)
  }
  return (
    <>
      <h2>Score your own CV</h2>
      <p className="muted">Go through each line with your CV open. Submit when you’re done; you can resubmit.</p>
      <Scorecard card={card} onChange={setCard} />
      <div className="submitbar">
        <button className="btn btn-primary btn-big" disabled={busy} onClick={submit}>
          {row ? (row.score === total ? `Submitted: ${row.score}` : `Update score to ${total}`) : `Submit score ${total}`}
        </button>
      </div>
    </>
  )
}

function Compare() {
  const { session } = useSession()
  return (
    <>
      <h2>Terrible vs good CV</h2>
      <p className="muted">Executive assistant. Spot every red flag on the first one.</p>
      <pre className="cv">{BAD_EA}</pre>
      {session?.reveal
        ? <>
            <h2>The good one</h2><pre className="cv">{GOOD_EA}</pre>
            {COMPARE_NOTES.map(([b, g]) => <div key={b} className="card"><div className="neg small">{b}</div><div className="pos">{g}</div></div>)}
          </>
        : <p className="center muted">The good CV appears when the host reveals it.</p>}
    </>
  )
}
