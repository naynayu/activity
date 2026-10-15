import type { BoardRow } from '../scoring'

const medal = (r: number) => (r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : String(r))

/** A compact grid that holds 50+ people on one projector screen. */
export function Board({ rows, big, meId, limit }: { rows: BoardRow[]; big?: boolean; meId?: string; limit?: number }) {
  const shown = limit ? rows.slice(0, limit) : rows
  if (!shown.length) return <p className="muted center">No scores yet.</p>
  return (
    <div className={`board ${big ? 'board-big' : ''}`}>
      {shown.map(r => (
        <div key={r.id} className={`pl ${r.rank <= 3 ? 'pl-top' : ''} ${r.id === meId ? 'pl-me' : ''}`}>
          <span className="pl-rk">{medal(r.rank)}</span>
          <span className="pl-nm" title={r.name}>{r.name}</span>
          <span className={`pl-sc ${r.total < 0 ? 'neg' : ''}`}>{r.total}</span>
        </div>
      ))}
    </div>
  )
}
