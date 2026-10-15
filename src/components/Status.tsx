import { useStatus } from '../store'

const LABEL = { live: 'Live', connecting: 'Reconnecting…', offline: 'Offline' } as const
export function StatusDot() {
  const s = useStatus()
  return <span className={`dot dot-${s}`} title={LABEL[s]}><i />{s !== 'live' && <small>{LABEL[s]}</small>}</span>
}
