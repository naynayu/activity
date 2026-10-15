import { useContent } from '../content'
import { computeScore, verdict } from '../scoring'

export interface Card { checks: number[]; deds: number[]; typos: number }
const toggle = (list: number[], i: number) => (list.includes(i) ? list.filter(x => x !== i) : [...list, i])

export function Scorecard({ card, onChange, disabled }: { card: Card; onChange: (c: Card) => void; disabled?: boolean }) {
  const c = useContent()
  const total = computeScore(card.checks, card.deds, card.typos, c)
  const v = verdict(total)
  return (
    <>
      <div className={`scorebar tone-${v.tone}`}>
        <div className="scorebar-n">{total}<small> / 100</small></div>
        <div className="scorebar-t">{v.text}</div>
      </div>
      <div className="card">
        <h3>1. Does your CV have this? <span className="faint">Tick to add points</span></h3>
        {c.checks.map(([text, pts], i) => (
          <label key={i} className="opt">
            <input type="checkbox" disabled={disabled} checked={card.checks.includes(i)} onChange={() => onChange({ ...card, checks: toggle(card.checks, i) })} />
            <span>{text}</span><b className="pos">+{pts}</b>
          </label>
        ))}
      </div>
      <div className="card">
        <h3>2. Does your CV have this? <span className="faint">Tick to lose 5 points</span></h3>
        {c.deds.map((text, i) => (
          <label key={i} className="opt">
            <input type="checkbox" disabled={disabled} checked={card.deds.includes(i)} onChange={() => onChange({ ...card, deds: toggle(card.deds, i) })} />
            <span>{text}</span><b className="neg">−5</b>
          </label>
        ))}
        <div className="opt">
          <span>Spelling or grammar mistakes (−5 each)</span>
          <span className="stepper">
            <button className="btn" disabled={disabled} onClick={() => onChange({ ...card, typos: Math.max(0, card.typos - 1) })}>−</button>
            <b>{card.typos}</b>
            <button className="btn" disabled={disabled} onClick={() => onChange({ ...card, typos: Math.min(40, card.typos + 1) })}>+</button>
          </span>
        </div>
      </div>
    </>
  )
}
