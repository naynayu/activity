import QRCode from 'qrcode'
import { useEffect, useMemo, useState } from 'react'
import { Board } from '../components/Board'
import { CvView, useCv } from '../components/PatientCv'
import { StatusDot } from '../components/Status'
import { STEPS, stepIndex, useContent } from '../content'
import { clock, useCountdown, useSession } from '../data'
import { buildBoard, computeScore } from '../scoring'
import { useTable } from '../store'
import type { AnswerRow, AwardRow, Participant, ScoreRow, SessionRow, SubmissionRow, VoteRow } from '../types'

export function Screen() {
  const s = useSession()
  const people = useTable<Participant>('participants').rows
  const scores = useTable<ScoreRow>('scores').rows
  const awards = useTable<AwardRow>('awards').rows
  const allAnswers = useTable<AnswerRow>('answers').rows
  const answerCount = allAnswers.length
  const c = useContent()
  const board = useMemo(() => buildBoard(people, scores, awards, allAnswers, c), [people, scores, awards, allAnswers, c])
  const [qr, setQr] = useState('')
  useEffect(() => { QRCode.toDataURL(location.origin + location.pathname, { margin: 1, width: 400 }).then(setQr) }, [])
  if (!s) return <div className="screen"><h1>Loading…</h1></div>
  const step = STEPS[stepIndex(s.phase)]

  return (
    <div className="screen">
      <header className="screen-head">
        <h1>🩺 The CV Clinic</h1>
        <div className="screen-meta">{step.title} · {people.length} joined <StatusDot /></div>
      </header>
      {s.message && <div className="banner banner-big">{s.message}</div>}
      {s.phase === 'welcome' && (
        <div className="screen-center">
          {qr && <img className="qr" src={qr} alt="Scan to join" />}
          <h2>Scan to join</h2><p className="muted big-p">Type your first name. {people.length} here so far.</p>
        </div>
      )}
      {s.phase === 'vote' && <Vote s={s} />}
      {s.phase === 'rewrite' && <Rewrite s={s} people={people} />}
      {s.phase === 'compare' && (
        <div>
          <div className="screen-two">
            <div><h2 className="neg">The bad CV · {computeScore(c.bad.chk, c.bad.ded, c.bad.typos, c)} out of 100</h2><pre className="cv">{c.bad.text}</pre></div>
            {s.reveal
              ? <div><h2 className="pos">The good CV · {computeScore(c.good.chk, c.good.ded, c.good.typos, c)} out of 100</h2><pre className="cv">{c.good.text}</pre></div>
              : <div className="card card-lg center"><h2>What is wrong with the bad CV?</h2><p className="muted big-p">Shout out what you see.</p></div>}
          </div>
          {s.reveal && <table className="screen-table"><thead><tr><th>Bad</th><th>Good</th></tr></thead>
            <tbody>{c.notes.map(([b, g]) => <tr key={b}><td className="neg">{b}</td><td className="pos">{g}</td></tr>)}</tbody></table>}
        </div>
      )}
      {s.phase === 'score' && (
        <div className="screen-center">
          <h2>Score your own CV</h2><p className="muted big-p">{step.say}</p>
          <div className="huge">{scores.length}<small> of {people.length} sent</small></div>
          <p className="muted">{s.scores_open ? 'Sending is open.' : 'Sending is not open yet.'}</p>
        </div>
      )}
      {s.phase === 'winners' && (s.show_board ? <Board rows={board} big /> : <div className="screen-center"><div className="huge">🥁</div><h2>And the winners are…</h2></div>)}
      {s.phase === 'quiz' && <div className="screen-center"><h2>Quiz time</h2><p className="muted big-p">{step.say}</p><div className="huge">{answerCount}<small> answers in</small></div></div>}
    </div>
  )
}

function Vote({ s }: { s: SessionRow }) {
  const votes = useTable<VoteRow>('votes').rows.filter(v => v.round === s.round)
  const hire = votes.filter(v => v.choice === 'hire').length, pass = votes.length - hire
  const pct = (n: number) => (votes.length ? Math.round((100 * n) / votes.length) : 0)
  const cv = useCv(s.round, `${s.reveal}`)
  return (
    <div className="screen-center">
      <div className="muted">Patient {s.round.replace('cv', '')}</div>
      {s.reveal
        ? <div className="cv-stage"><CvView cv={cv} /></div>
        : <div className="huge">Get ready</div>}
      <div className="bars">
        <div className="bar"><div className="bar-fill pos-bg" style={{ height: `${pct(hire)}%` }} /><div className="bar-n">👍 {hire}</div></div>
        <div className="bar"><div className="bar-fill neg-bg" style={{ height: `${pct(pass)}%` }} /><div className="bar-n">👎 {pass}</div></div>
      </div>
      <p className="muted">{votes.length} votes</p>
    </div>
  )
}

function Rewrite({ s, people }: { s: SessionRow; people: Participant[] }) {
  const subs = useTable<SubmissionRow>('submissions').rows.filter(x => x.round === s.round)
  const left = useCountdown(s.timer_end)
  const list = [...subs].sort((a, b) => Number(b.picked) - Number(a.picked) || b.created_at.localeCompare(a.created_at))
  const who = (id: string | null) => (id ? people.find(p => p.id === id)?.name ?? '' : 'Example')
  return (
    <div>
      <div className="screen-center" style={{ minHeight: 0, marginBottom: 12 }}>
        <p className="muted">Rewrite this line with a result and a number</p>
        <h2 style={{ fontSize: 44 }}>“{s.weak_line}”</h2>
        <div className="huge">{left == null ? '60' : clock(left)}</div>
        <p className="muted">{subs.length} rewrites in</p>
      </div>
      <div className="grid-subs">{list.slice(0, 12).map(x => <div key={x.id} className={`card ${x.picked ? 'picked' : ''}`}>{x.content}<div className="faint small">{who(x.participant_id)}</div></div>)}</div>
    </div>
  )
}
