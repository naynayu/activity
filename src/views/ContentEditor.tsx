import { useState } from 'react'
import { useContent, type Content, type CvExample } from '../content'
import { dbDelete, dbUpsert } from '../store'

const lines = (s: string) => s.split('\n').map(x => x.trim()).filter(Boolean)
const pair = (s: string): [string, string] => { const i = s.indexOf('|'); return i < 0 ? [s.trim(), ''] : [s.slice(0, i).trim(), s.slice(i + 1).trim()] }
const nums = (s: string) => s.split(/[,\s]+/).map(x => parseInt(x, 10) - 1).filter(n => n >= 0)
const showNums = (a: number[]) => a.map(n => n + 1).join(', ')

export function ContentEditor() {
  const c = useContent()
  const [checks, setChecks] = useState(c.checks.map(([t, p]) => `${t} | ${p}`).join('\n'))
  const [deds, setDeds] = useState(c.deds.join('\n'))
  const [glow, setGlow] = useState(c.glow.map(([a, b]) => `${a} | ${b}`).join('\n'))
  const [notes, setNotes] = useState(c.notes.map(([a, b]) => `${a} | ${b}`).join('\n'))
  const [qa, setQa] = useState(c.qa.map(([a, b]) => `${a} | ${b}`).join('\n'))
  const [bad, setBad] = useState(cvState(c.bad))
  const [good, setGood] = useState(cvState(c.good))
  const [msg, setMsg] = useState('')

  async function save() {
    const data: Content = {
      checks: lines(checks).map(l => { const i = l.lastIndexOf('|'); return [l.slice(0, i < 0 ? undefined : i).trim(), i < 0 ? 0 : parseInt(l.slice(i + 1), 10) || 0] as [string, number] }),
      deds: lines(deds),
      glow: lines(glow).map(pair), notes: lines(notes).map(pair), qa: lines(qa).map(pair),
      bad: cvFrom(bad), good: cvFrom(good),
    }
    const r = await dbUpsert('content', { id: 'v1', data, updated_at: new Date().toISOString() })
    setMsg(r.ok ? 'Saved. Every phone and the projector use it now.' : 'Could not save.')
  }
  return (
    <div className="editor">
      <p className="muted small">One item per line. Use “ | ” to split the parts. Scores already sent are not recalculated.</p>
      <Field label="Checklist: text | points" v={checks} set={setChecks} />
      <Field label="Red flags (−5 each)" v={deds} set={setDeds} />
      <Field label="Rewrite examples: before | after" v={glow} set={setGlow} />
      <Field label="Bad vs good notes: bad | good" v={notes} set={setNotes} />
      <Field label="Prepared questions: question | answer" v={qa} set={setQa} />
      <CvField title="The bad CV" v={bad} set={setBad} />
      <CvField title="The good CV" v={good} set={setGood} />
      <div className="row"><button className="btn btn-primary" onClick={save}>Save changes</button>
        <button className="btn" onClick={async () => { if (confirm('Go back to the built-in content?')) { await dbDelete('content', { id: 'v1' }); setMsg('Reset. Reload this page to see the defaults here.') } }}>Reset to built-in</button></div>
      {msg && <p className="pos">{msg}</p>}
    </div>
  )
}

interface CvS { text: string; chk: string; ded: string; typos: string }
const cvState = (c: CvExample): CvS => ({ text: c.text, chk: showNums(c.chk), ded: showNums(c.ded), typos: String(c.typos) })
const cvFrom = (s: CvS): CvExample => ({ text: s.text, chk: nums(s.chk), ded: nums(s.ded), typos: Math.max(0, parseInt(s.typos, 10) || 0) })

function Field({ label, v, set }: { label: string; v: string; set: (s: string) => void }) {
  return <label className="fld">{label}<textarea className="input" rows={Math.min(12, Math.max(3, v.split('\n').length))} value={v} onChange={e => set(e.target.value)} /></label>
}
function CvField({ title, v, set }: { title: string; v: CvS; set: (s: CvS) => void }) {
  return (
    <div className="fld"><b>{title}</b>
      <textarea className="input" rows={10} value={v.text} onChange={e => set({ ...v, text: e.target.value })} />
      <div className="row"><label className="fld" style={{ flex: 1 }}>Checklist numbers it passes<input className="input" value={v.chk} onChange={e => set({ ...v, chk: e.target.value })} /></label>
        <label className="fld" style={{ flex: 1 }}>Red flag numbers it has<input className="input" value={v.ded} onChange={e => set({ ...v, ded: e.target.value })} /></label>
        <label className="fld" style={{ width: 90 }}>Typos<input className="input" value={v.typos} onChange={e => set({ ...v, typos: e.target.value })} /></label></div>
    </div>
  )
}
