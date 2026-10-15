import QRCode from 'qrcode'
import { useEffect, useMemo, useState } from 'react'
import { Board } from '../components/Board'
import { Questions } from '../components/Questions'
import { BAD_EA, BAD_EA_CHK, BAD_EA_DEDS, BAD_EA_TYPOS, COMPARE_NOTES, GLOW, GOOD_EA, GOOD_EA_CHK, PHASES, SAMPLE, SAMPLE_CHK, SAMPLE_DED, SAMPLE_TYPOS, SYMPTOMS, phaseIndex } from '../content'
import { clock, useCountdown, useRows, useSession } from '../data'
import { buildBoard, computeScore } from '../scoring'
import type { AwardRow, Participant, ScoreRow, SubmissionRow, VoteRow } from '../types'

export function Screen() {
  const { session } = useSession()
  const people = useRows<Participant>('participants', [], 8000)
  const scores = useRows<ScoreRow>('scores', [], 4000)
  const awards = useRows<AwardRow>('awards', [], 4000)
  const board = useMemo(() => buildBoard(people.rows, scores.rows, awards.rows), [people.rows, scores.rows, awards.rows])
  const left = useCountdown(session?.timer_end)
  const [qr, setQr] = useState('')
  useEffect(() => { QRCode.toDataURL(location.origin + location.pathname, { margin: 1, width: 360 }).then(setQr) }, [])
  if (!session) return <div className="screen"><h1>Loading…</h1></div>
  const info = PHASES[Math.max(0, phaseIndex(session.phase))]

  return (
    <div className="screen">
      <header className="screen-head">
        <h1>🩺 The CV Clinic</h1>
        <div className="screen-meta">{info.title} · {people.rows.length} joined</div>
      </header>
      {session.message && <div className="banner banner-big">{session.message}</div>}
      {session.phase === 'lobby' && (
        <div className="screen-center">
          {qr && <img className="qr" src={qr} alt="Scan to join" />}
          <h2>Scan to join</h2>
          <p className="muted big-p">Enter your first name. {people.rows.length} here so far.</p>
        </div>
      )}
      {session.phase === 'hirepass' && <HirePass round={session.round} reveal={session.reveal} left={left} />}
      {session.phase === 'diagnosis' && (
        <table className="screen-table">
          <thead><tr><th>Symptom</th><th>What it means</th><th>The cure</th></tr></thead>
          <tbody>{SYMPTOMS.map(([n, m, c]) => <tr key={n}><td><b>{n}</b></td><td>{m}</td><td className="pos">{c}</td></tr>)}</tbody>
        </table>
      )}
      {session.phase === 'glowup' && <GlowUp round={session.round} left={left} />}
      {session.phase === 'practice' && (
        <div className="screen-two">
          <pre className="cv">{SAMPLE}</pre>
          <div className="card card-lg center">
            {session.reveal
              ? <><div className="muted">The verdict</div><div className="huge neg">{computeScore(SAMPLE_CHK, SAMPLE_DED, SAMPLE_TYPOS)}</div>
                  <p>5 points earned − 17 red flags × 5</p><p className="muted">What did Seun actually do at ABC Ventures?</p></>
              : <><h2>Score this CV as a room</h2><p className="muted big-p">Use the scorecard on your phone. Shout the red flags.</p></>}
          </div>
        </div>
      )}
      {session.phase === 'compare' && (
        <div>
          <div className="screen-two">
            <div><h2 className="neg">Terrible · {computeScore(BAD_EA_CHK, BAD_EA_DEDS, BAD_EA_TYPOS)}/100</h2><pre className="cv">{BAD_EA}</pre></div>
            {session.reveal
              ? <div><h2 className="pos">Good · {computeScore(GOOD_EA_CHK, [], 0)}/100</h2><pre className="cv">{GOOD_EA}</pre></div>
              : <div className="card card-lg center"><h2>Executive Assistant</h2><p className="muted big-p">Shout every red flag you can spot.</p></div>}
          </div>
          {session.reveal && (
            <table className="screen-table"><thead><tr><th>Terrible</th><th>Good</th></tr></thead>
              <tbody>{COMPARE_NOTES.map(([b, g]) => <tr key={b}><td className="neg">{b}</td><td className="pos">{g}</td></tr>)}</tbody></table>
          )}
        </div>
      )}
      {session.phase === 'scorecard' && (
        <div className="screen-two">
          <div className="card card-lg"><h2>Score your own CV</h2><p className="muted big-p">Phone out, CV open. Submit when you’re done.</p>
            <div className="huge">{scores.rows.length}<small> of {people.rows.length} submitted</small></div></div>
          <div><h2>Top 10 so far</h2><Board rows={board} limit={10} /></div>
        </div>
      )}
      {session.phase === 'leaderboard' && <Board rows={board} big />}
      {session.phase === 'qa' && <Questions mode="screen" />}
    </div>
  )
}

function HirePass({ round, reveal, left }: { round: string; reveal: boolean; left: number | null }) {
  const votes = useRows<VoteRow>('votes', [['round', round]], 2000)
  const hire = votes.rows.filter(v => v.choice === 'hire').length
  const pass = votes.rows.length - hire
  const pct = (n: number) => (votes.rows.length ? Math.round((100 * n) / votes.rows.length) : 0)
  const showing = reveal && left != null && left > 0
  return (
    <div className="screen-center">
      <div className="muted">{round.replace('cv', 'Patient ')}</div>
      <div className="huge">{showing ? left : reveal ? 'Vote!' : 'Get ready'}</div>
      <div className="bars">
        <div className="bar"><div className="bar-fill pos-bg" style={{ height: `${pct(hire)}%` }} /><div className="bar-n">👍 {hire}</div></div>
        <div className="bar"><div className="bar-fill neg-bg" style={{ height: `${pct(pass)}%` }} /><div className="bar-n">👎 {pass}</div></div>
      </div>
      <p className="muted">{votes.rows.length} votes</p>
    </div>
  )
}

function GlowUp({ round, left }: { round: string; left: number | null }) {
  const subs = useRows<SubmissionRow>('submissions', [['round', round]], 3000)
  const people = useRows<Participant>('participants', [], 10000)
  const list = [...subs.rows].sort((a, b) => Number(b.picked) - Number(a.picked) || b.created_at.localeCompare(a.created_at))
  const who = (id: string) => people.rows.find(p => p.id === id)?.name ?? ''
  return (
    <div>
      <div className="screen-center" style={{ minHeight: 0 }}><div className="huge">{left == null ? '60' : clock(left)}</div><p className="muted">Rewrite it with a result and a number. {subs.rows.length} in.</p></div>
      {list.length === 0 && (
        <table className="screen-table"><thead><tr><th>Before</th><th>After</th></tr></thead>
          <tbody>{GLOW.slice(0, 3).map(([b, a]) => <tr key={b}><td className="neg">{b}</td><td className="pos">{a}</td></tr>)}</tbody></table>
      )}
      <div className="grid-subs">{list.slice(0, 12).map(s => <div key={s.id} className={`card ${s.picked ? 'picked' : ''}`}>{s.content}<div className="faint small">{who(s.participant_id)}</div></div>)}</div>
    </div>
  )
}
