import { useMemo, useState } from 'react'
import { QUIZ, QUIZ_POINTS } from '../content'
import { dbUpsert, useTable } from '../store'
import type { AnswerRow, Participant, SessionRow } from '../types'

export const pointsFor = (answers: AnswerRow[]) => answers.reduce((n, a) => n + (QUIZ[a.q]?.answer === a.choice ? QUIZ_POINTS : 0), 0)

export function Quiz({ me, s }: { me: Participant; s: SessionRow }) {
  const all = useTable<AnswerRow>('answers').rows
  const people = useTable<Participant>('participants').rows
  const mine = all.filter(a => a.participant_id === me.id)
  const [err, setErr] = useState('')
  const board = useMemo(() => leaderboard(people, all), [people, all])
  const rank = board.find(r => r.id === me.id)
  const pick = async (q: number, choice: number) => {
    setErr('')
    const r = await dbUpsert('answers', { participant_id: me.id, q, choice })
    if (!r.ok) setErr('The quiz is closed.')
  }
  return (
    <>
      <h2>Quick quiz</h2>
      <div className="card center">
        {s.quiz_reveal
          ? <><div className="big">{pointsFor(mine)}<small> / {QUIZ.length * QUIZ_POINTS}</small></div><div className="muted">Your score{rank ? ` · #${rank.rank} of ${board.length}` : ''}</div></>
          : <><div className="big">{mine.length}<small> / {QUIZ.length}</small></div><div className="muted">answered · {QUIZ_POINTS} points each</div></>}
      </div>
      {!s.quiz_open && !s.quiz_reveal && <div className="card center muted">🔒 Opens when the host starts the quiz.</div>}
      {err && <p className="center neg">{err}</p>}
      {QUIZ.map((item, qi) => {
        const choice = mine.find(a => a.q === qi)?.choice
        return (
          <div key={qi} className="card"><b>{qi + 1}. {item.q}</b>
            {item.options.map((o, oi) => {
              const right = s.quiz_reveal && oi === item.answer
              const wrong = s.quiz_reveal && choice === oi && oi !== item.answer
              return <button key={oi} disabled={!s.quiz_open} onClick={() => pick(qi, oi)}
                className={`btn opt-btn ${choice === oi && !s.quiz_reveal ? 'btn-primary' : ''} ${right ? 'right' : ''} ${wrong ? 'wrong' : ''}`}>
                {String.fromCharCode(65 + oi)}. {o}{right ? ' ✓' : ''}{wrong ? ' ✗' : ''}</button>
            })}
            {s.quiz_reveal && <p className="small muted" style={{ margin: '8px 0 0' }}>{choice == null ? 'You did not answer. ' : ''}{item.why}</p>}
          </div>
        )
      })}
      {s.quiz_reveal && <Board rows={board} meId={me.id} />}
    </>
  )
}

export interface BoardRow { id: string; name: string; points: number; rank: number }
export function leaderboard(people: Participant[], answers: AnswerRow[]): BoardRow[] {
  const rows = people.map(p => ({ id: p.id, name: p.name, points: pointsFor(answers.filter(a => a.participant_id === p.id)), rank: 0 }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
  rows.forEach((r, i) => { r.rank = i > 0 && rows[i - 1].points === r.points ? rows[i - 1].rank : i + 1 })
  return rows
}
export const Board = ({ rows, meId }: { rows: BoardRow[]; meId?: string }) => (
  <div className="card"><h3>Leaderboard</h3>
    {rows.map(r => <div key={r.id} className={`row ${r.id === meId ? 'me' : ''}`}><span><b>#{r.rank}</b> {r.name}</span><b>{r.points}</b></div>)}</div>
)
