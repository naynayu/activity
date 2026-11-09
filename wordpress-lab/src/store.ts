import { useEffect, useSyncExternalStore } from 'react'
import { sb } from './supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>
const PK: Record<string, string[]> = {
  session: ['id'], participants: ['id'], progress: ['participant_id', 'step', 'task'], help: ['participant_id'],
}
interface T { rows: Map<string, Row>; snap: Row[]; ready: boolean; subs: Set<() => void>; dirty: boolean }
const tables: Record<string, T> = {}
const tbl = (t: string): T => (tables[t] ??= { rows: new Map(), snap: [], ready: false, subs: new Set(), dirty: false })
const keyOf = (t: string, r: Row) => PK[t].map(c => String(r[c])).join('|')

function touch(t: string) {
  const T = tbl(t)
  if (T.dirty) return
  T.dirty = true
  setTimeout(() => { T.dirty = false; T.snap = [...T.rows.values()]; T.subs.forEach(f => f()) }, 30)
}

async function load(t: string) {
  const { data, error } = await sb.from(t).select('*').limit(5000)
  if (error || !data) return
  const T = tbl(t)
  T.rows = new Map(data.map(r => [keyOf(t, r), r]))
  T.ready = true
  touch(t)
}

export type Status = 'connecting' | 'live' | 'offline'
let status: Status = 'connecting'
const statusSubs = new Set<() => void>()
const setStatus = (s: Status) => { if (s !== status) { status = s; statusSubs.forEach(f => f()) } }
export const useStatus = (): Status => useSyncExternalStore(f => { statusSubs.add(f); return () => statusSubs.delete(f) }, () => status)

let started = false
function start() {
  if (started) return
  started = true
  const ch = sb.channel('wordpress-lab')
  for (const t of Object.keys(PK)) {
    ch.on('postgres_changes', { event: '*', schema: 'public', table: t }, p => {
      const T = tbl(t)
      if (!T.ready) return
      if (p.eventType === 'DELETE') T.rows.delete(keyOf(t, p.old as Row))
      else T.rows.set(keyOf(t, p.new as Row), p.new as Row)
      touch(t)
    })
  }
  ch.subscribe(s => {
    if (s === 'SUBSCRIBED') { setStatus('live'); refreshAll() }
    else if (s === 'CLOSED' || s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') setStatus('connecting')
  })
  const wake = () => { if (document.visibilityState !== 'hidden') refreshAll() }
  addEventListener('visibilitychange', wake)
  addEventListener('focus', wake)
  addEventListener('online', refreshAll)
  addEventListener('offline', () => setStatus('offline'))
  // Slow, jittered safety net so many phones do not ask at once.
  const loop = () => { refreshAll(); setTimeout(loop, 8000 + Math.random() * 4000) }
  setTimeout(loop, 8000 + Math.random() * 4000)
}
export const refreshAll = () => { for (const t of Object.keys(tables)) load(t) }

export function useTable<R = Row>(t: string): { rows: R[]; ready: boolean } {
  useEffect(() => { start(); if (!tbl(t).ready) load(t) }, [t])
  const sub = (f: () => void) => { tbl(t).subs.add(f); return () => { tbl(t).subs.delete(f) } }
  const rows = useSyncExternalStore(sub, () => tbl(t).snap)
  const ready = useSyncExternalStore(sub, () => tbl(t).ready)
  return { rows: rows as R[], ready }
}

// Writes show on screen at once, then the database confirms (and we reload if it refuses).
export interface Result { ok: boolean; message?: string }
const apply = (t: string, fn: (rows: Map<string, Row>) => void) => { const T = tbl(t); if (T.ready) { fn(T.rows); touch(t) } }
async function settle(t: string, p: PromiseLike<{ error: { message: string } | null }>): Promise<Result> {
  const { error } = await p
  if (error) { load(t); return { ok: false, message: error.message } }
  return { ok: true }
}
export const dbUpsert = (t: string, row: Row) => {
  apply(t, rows => { const k = keyOf(t, row); rows.set(k, { ...rows.get(k), ...row }) })
  return settle(t, sb.from(t).upsert(row))
}
export const dbUpdate = (t: string, match: Row, patch: Row) => {
  apply(t, rows => rows.forEach((r, k) => { if (Object.entries(match).every(([c, v]) => r[c] === v)) rows.set(k, { ...r, ...patch }) }))
  let q = sb.from(t).update(patch)
  for (const [c, v] of Object.entries(match)) q = q.eq(c, v)
  return settle(t, q)
}
export const dbDelete = (t: string, match: Row) => {
  apply(t, rows => rows.forEach((r, k) => { if (Object.entries(match).every(([c, v]) => r[c] === v)) rows.delete(k) }))
  let q = sb.from(t).delete()
  for (const [c, v] of Object.entries(match)) q = q.eq(c, v)
  return settle(t, q)
}
