import { useState } from 'react'
import { useRows } from '../data'
import { sb } from '../supabase'
import type { Participant, QuestionRow, QVoteRow } from '../types'

type Mode = 'phone' | 'screen' | 'host'

export function Questions({ mode, me }: { mode: Mode; me?: Participant }) {
  const qs = useRows<QuestionRow>('questions')
  const votes = useRows<QVoteRow>('question_votes')
  const people = useRows<Participant>('participants', [], 15000)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  const count = (id: string) => votes.rows.filter(v => v.question_id === id).length
  const mine = (id: string) => !!me && votes.rows.some(v => v.question_id === id && v.participant_id === me.id)
  const who = (id: string | null) => people.rows.find(p => p.id === id)?.name ?? 'Anonymous'
  const sorted = [...qs.rows].sort((a, b) =>
    Number(a.answered) - Number(b.answered) || count(b.id) - count(a.id) || a.created_at.localeCompare(b.created_at))

  async function ask() {
    const t = text.trim()
    if (!t || !me || busy) return
    setBusy(true)
    await sb.from('questions').insert({ text: t, participant_id: me.id })
    setText(''); setBusy(false); qs.refetch()
  }
  async function vote(id: string) {
    if (!me) return
    if (mine(id)) await sb.from('question_votes').delete().eq('question_id', id).eq('participant_id', me.id)
    else await sb.from('question_votes').insert({ question_id: id, participant_id: me.id })
    votes.refetch()
  }
  const setAnswered = async (id: string, answered: boolean) => { await sb.from('questions').update({ answered }).eq('id', id); qs.refetch() }
  const remove = async (id: string) => { await sb.from('questions').delete().eq('id', id); qs.refetch() }

  return (
    <div>
      {mode === 'phone' && (
        <div className="card">
          <textarea className="input" rows={3} maxLength={300} placeholder="Ask your question" value={text} onChange={e => setText(e.target.value)} />
          <button className="btn btn-primary btn-big" disabled={!text.trim() || busy} onClick={ask}>Send question</button>
        </div>
      )}
      {!sorted.length && <p className="muted center">No questions yet.</p>}
      {sorted.map(q => (
        <div key={q.id} className={`q ${q.answered ? 'q-done' : ''}`}>
          <div className="q-body">
            <div className="q-text">{q.text}</div>
            <small className="faint">{who(q.participant_id)}</small>
          </div>
          {mode === 'phone'
            ? <button className={`btn ${mine(q.id) ? 'btn-primary' : ''}`} onClick={() => vote(q.id)}>▲ {count(q.id)}</button>
            : <b className="q-n">▲ {count(q.id)}</b>}
          {mode === 'host' && (
            <span className="q-actions">
              <button className="btn" onClick={() => setAnswered(q.id, !q.answered)}>{q.answered ? 'Reopen' : 'Answered'}</button>
              <button className="btn" onClick={() => remove(q.id)}>✕</button>
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
