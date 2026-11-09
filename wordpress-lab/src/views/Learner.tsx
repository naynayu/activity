import { Bar, StatusDot } from '../components'
import { PLAYGROUND_URL, STEPS, taskKey } from '../content'
import { useSession } from '../data'
import { dbDelete, dbUpsert, useTable } from '../store'
import type { HelpRow, Participant, ProgressRow } from '../types'

export function Learner({ me, onLeave }: { me: Participant; onLeave: () => void }) {
  const s = useSession()
  const progress = useTable<ProgressRow>('progress').rows.filter(p => p.participant_id === me.id)
  const help = useTable<HelpRow>('help').rows.find(h => h.participant_id === me.id)
  if (!s) return <div className="phone"><div className="skel" /></div>
  const step = STEPS[Math.min(s.step, STEPS.length - 1)]
  const done = new Set(progress.map(p => taskKey(p.step, p.task)))
  const doneHere = step.tasks.filter((_, i) => done.has(taskKey(s.step, i))).length
  const stuck = !!help?.stuck && help.step === s.step

  const toggle = (i: number) => done.has(taskKey(s.step, i))
    ? dbDelete('progress', { participant_id: me.id, step: s.step, task: i })
    : dbUpsert('progress', { participant_id: me.id, step: s.step, task: i })
  const toggleStuck = () => dbUpsert('help', { participant_id: me.id, step: s.step, stuck: !stuck, updated_at: new Date().toISOString() })

  return (
    <div className="phone">
      <header className="phone-head"><div><b>{me.name}</b> <StatusDot /></div><button className="btn" onClick={onLeave}>Leave</button></header>
      {s.message && <div className="banner">{s.message}</div>}
      <div className="muted small">Step {s.step + 1} of {STEPS.length}</div>
      <h2 style={{ marginTop: 4 }}>{step.title}</h2>
      <p className="say">{step.idea}</p>
      {s.step === 0 && <a className="btn btn-primary btn-big" href={PLAYGROUND_URL} target="_blank" rel="noreferrer">Open WordPress Playground ↗</a>}
      <div className="card">
        <div className="row"><b>Your tasks</b><span className="muted small">{doneHere} / {step.tasks.length}</span></div>
        <Bar done={doneHere} total={step.tasks.length} />
        {step.tasks.map((t, i) => (
          <label key={i} className="opt"><input type="checkbox" checked={done.has(taskKey(s.step, i))} onChange={() => toggle(i)} /><span>{t}</span></label>
        ))}
      </div>
      {step.hint && <p className="muted small">💡 {step.hint}</p>}
      <button className={`btn btn-big ${stuck ? 'btn-warn' : ''}`} onClick={toggleStuck}>{stuck ? '✋ Help is coming. Tap if you are unstuck' : '✋ I’m stuck'}</button>
      {doneHere === step.tasks.length && <p className="center pos"><b>Step complete. Wait for the host.</b></p>}
    </div>
  )
}
