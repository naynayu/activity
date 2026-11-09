import { useMemo } from 'react'
import { Bar, Qr } from '../components'
import { STEPS } from '../content'
import { useSession } from '../data'
import { useTable } from '../store'
import type { HelpRow, Participant, ProgressRow } from '../types'

export function Screen() {
  const s = useSession()
  const people = useTable<Participant>('participants').rows
  const progress = useTable<ProgressRow>('progress').rows
  const help = useTable<HelpRow>('help').rows
  const stats = useMemo(() => {
    if (!s) return { finished: 0, stuck: 0 }
    const n = STEPS[s.step].tasks.length
    const per = new Map<string, number>()
    progress.filter(p => p.step === s.step).forEach(p => per.set(p.participant_id, (per.get(p.participant_id) ?? 0) + 1))
    return { finished: people.filter(p => (per.get(p.id) ?? 0) >= n).length, stuck: help.filter(h => h.stuck && h.step === s.step).length }
  }, [s, people, progress, help])
  if (!s) return null
  const step = STEPS[s.step]
  return (
    <div className="screen">
      <div>
        <div className="muted">Step {s.step + 1} of {STEPS.length} · about {step.minutes} min</div>
        <h1 className="huge-t">{step.title}</h1>
        <p className="lead">{step.idea}</p>
        <ol className="lead-list">{step.tasks.map(t => <li key={t}>{t}</li>)}</ol>
      </div>
      <aside className="center">
        <Qr url={location.origin + location.pathname} size={260} />
        <p className="muted">Scan to join</p>
        <h2>{stats.finished} / {people.length} finished</h2>
        <Bar done={stats.finished} total={people.length} />
        {stats.stuck > 0 && <h2 className="warn">✋ {stats.stuck} need help</h2>}
      </aside>
    </div>
  )
}
