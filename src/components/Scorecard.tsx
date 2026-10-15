import { CHECKS, DEDUCT } from '../content'
import { computeScore, verdict } from '../scoring'

export interface Card { checks: number[]; deds: number[]; typos: number }

const toggle = (list: number[], i: number) => (list.includes(i) ? list.filter(x => x !== i) : [...list, i])

export function Scorecard({ card, onChange }: { card: Card; onChange: (c: Card) => void }) {
  const total = computeScore(card.checks, card.deds, card.typos)
  const v = verdict(total)
  return (
    <>
      <div className={`scorebar tone-${v.tone}`}>
        <div className="scorebar-n">{total}<small> / 100</small></div>
        <div className="scorebar-t">{v.text}</div>
      </div>
      <div className="card">
        <h3>Checklist <span className="faint">(add points)</span></h3>
        {CHECKS.map(([text, pts], i) => (
          <label key={i} className="opt">
            <input type="checkbox" checked={card.checks.includes(i)} onChange={() => onChange({ ...card, checks: toggle(card.checks, i) })} />
            <span>{i + 1}. {text}</span><b className="pos">+{pts}</b>
          </label>
        ))}
      </div>
      <div className="card">
        <h3>Deductions <span className="faint">(−5 each)</span></h3>
        {DEDUCT.map((text, i) => (
          <label key={i} className="opt">
            <input type="checkbox" checked={card.deds.includes(i)} onChange={() => onChange({ ...card, deds: toggle(card.deds, i) })} />
            <span>{text}</span><b className="neg">−5</b>
          </label>
        ))}
        <div className="opt">
          <span>Spelling or grammar errors (−5 each)</span>
          <span className="stepper">
            <button className="btn" onClick={() => onChange({ ...card, typos: Math.max(0, card.typos - 1) })}>−</button>
            <b>{card.typos}</b>
            <button className="btn" onClick={() => onChange({ ...card, typos: Math.min(40, card.typos + 1) })}>+</button>
          </span>
        </div>
      </div>
    </>
  )
}
