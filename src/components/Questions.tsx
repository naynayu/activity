import { useState } from 'react'
import { dbDelete, dbInsert, dbUpdate, useTable } from '../store'
import type { Participant, QuestionRow, QVoteRow } from '../types'

type Mode = 'phone' | 'screen' | 'host'

export function Questions({ mode, me, open = true }: { mode: Mode; me?: Participant; open?: boolean }) {
  const qs = useTable<QuestionRow>('questions').rows
  const votes = useTable<QVoteRow>('question_votes').rows
  const people = useTable<Participant>('participants').rows
  const [text, setText] = useState('')
  const [err, setErr] = useState('')

  const count = (id: string) => votes.filter(v => v.question_id === id).length
  const mine = (id: string) => !!me && votes.some(v => v.question_id === id && v.participant_id === me.id)
  const who = (id: string | null) => people.find(p => p.id === id)?.name ?? ''
  const sorted = [...qs].sort((a, b) => Number(a.answered) - Number(b.answered) || count(b.id) - count(a.id) || a.created_at.localeCompare(b.created_at))

  async function ask() {
    const t = text.trim()
    if (!t || !me) return
    setText(''); setErr('')
    const r = await dbInsert('questions', [{ id: crypto.randomUUID(), text: t, participant_id: me.id, answered: false, created_at: new Date().toISOString() }])
    if (!r.ok) setErr('Could not send. Try again.')
  }
  const vote = (id: string) => me && (mine(id)
    ? dbDelete('question_votes', { question_id: id, participant_id: me.id })
    : dbInsert('question_votes', [{ question_id: id, participant_id: me.id }]))

  return (
    <div>
      {mode === 'phone' && (
        <div className="card">
          <textarea className="input" rows={3} maxLength={300} disabled={!open} placeholder={open ? 'Type your question' : 'Questions are closed for now'} value={text} onChange={e => setText(e.target.value)} />
          {err && <p className="neg small">{err}</p>}
          <button className="btn btn-primary btn-big" disabled={!text.trim() || !open} onClick={ask}>Send question</button>
        </div>
      )}
      {!sorted.length && <p className="muted center">No questions yet.</p>}
      {sorted.map(q => (
        <div key={q.id} className={`q ${q.answered ? 'q-done' : ''}`}>
          <div className="q-body"><div className="q-text">{q.text}</div>{who(q.participant_id) && <small className="faint">{who(q.participant_id)}</small>}</div>
          {mode === 'phone'
            ? <button className={`btn ${mine(q.id) ? 'btn-primary' : ''}`} onClick={() => vote(q.id)}>▲ {count(q.id)}</button>
            : <b className="q-n">▲ {count(q.id)}</b>}
          {mode === 'host' && (
            <span className="q-actions">
              <button className="btn" onClick={() => dbUpdate('questions', { id: q.id }, { answered: !q.answered })}>{q.answered ? 'Reopen' : 'Answered'}</button>
              <button className="btn" onClick={() => dbDelete('questions', { id: q.id })}>✕</button>
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
