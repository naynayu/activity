import { useEffect, useSyncExternalStore } from 'react'
import { sb } from './supabase'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>

/** Primary key columns per table, so a realtime event can be applied straight to the cache. */
const PK: Record<string, string[]> = {
  session: ['id'], participants: ['id'], votes: ['participant_id', 'round'], submissions: ['id'],
  scores: ['participant_id'], awards: ['id'], questions: ['id'], question_votes: ['question_id', 'participant_id'],
  content: ['id'],
}

interface T { rows: Map<string, Row>; snap: Row[]; ready: boolean; loading: boolean; subs: Set<() => void>; dirty: boolean }
const tables: Record<string, T> = {}
const tbl = (t: string): T => (tables[t] ??= { rows: new Map(), snap: [], ready: false, loading: false, subs: new Set(), dirty: false })
const keyOf = (t: string, r: Row) => PK[t].map(c => String(r[c])).join('|')

/** Several changes in a burst become one re-render. */
function touch(t: string) {
  const T = tbl(t)
  if (T.dirty) return
  T.dirty = true
  setTimeout(() => { T.dirty = false; T.snap = [...T.rows.values()]; T.subs.forEach(f => f()) }, 30)
}

export const peek = (t: string): Row[] => tbl(t).snap

async function load(t: string) {
  const T = tbl(t)
  if (T.loading) return
  T.loading = true
  const { data, error } = await sb.from(t).select('*').limit(5000)
  T.loading = false
  if (error || !data) return
  T.rows = new Map(data.map(r => [keyOf(t, r), r]))
  T.ready = true
  touch(t)
}

// ---- connection: one channel for every table, however many components listen ----
export type Status = 'connecting' | 'live' | 'offline'
let status: Status = 'connecting'
const statusSubs = new Set<() => void>()
const setStatus = (s: Status) => { if (s !== status) { status = s; statusSubs.forEach(f => f()) } }
export const useStatus = (): Status => useSyncExternalStore(f => { statusSubs.add(f); return () => statusSubs.delete(f) }, () => status)

let channel: ReturnType<typeof sb.channel> | null = null
function ensureChannel() {
  if (channel) return
  channel = sb.channel('cv-clinic')
  for (const t of Object.keys(PK)) {
    channel.on('postgres_changes', { event: '*', schema: 'public', table: t }, p => {
      const T = tbl(t)
      if (!T.ready) return
      if (p.eventType === 'DELETE') T.rows.delete(keyOf(t, p.old as Row))
      else T.rows.set(keyOf(t, p.new as Row), p.new as Row)
      touch(t)
    })
  }
  channel.subscribe(s => {
    if (s === 'SUBSCRIBED') { setStatus('live'); refreshAll() }
    else if (s === 'CLOSED' || s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') setStatus('connecting')
  })
  // Phones sleep and lose their socket. Catch up the moment they wake.
  const wake = () => { if (document.visibilityState !== 'hidden') refreshAll() }
  addEventListener('visibilitychange', wake)
  addEventListener('focus', wake)
  addEventListener('online', () => { setStatus('connecting'); refreshAll() })
  addEventListener('offline', () => setStatus('offline'))
  // Safety net: a slow, jittered refresh so 50 phones do not all ask at once.
  const loop = () => { refreshAll(); setTimeout(loop, 8000 + Math.random() * 4000) }
  setTimeout(loop, 8000 + Math.random() * 4000)
}
export function refreshAll() { for (const t of Object.keys(tables)) if (tables[t].ready || tables[t].subs.size) load(t) }

const subscribers: Record<string, (f: () => void) => () => void> = {}
const subscribeFor = (t: string) => (subscribers[t] ??= f => { tbl(t).subs.add(f); return () => { tbl(t).subs.delete(f) } })

export function useTable<R = Row>(t: string): { rows: R[]; ready: boolean } {
  useEffect(() => { ensureChannel(); if (!tbl(t).ready) load(t) }, [t])
  const rows = useSyncExternalStore(subscribeFor(t), () => tbl(t).snap)
  const ready = useSyncExternalStore(subscribeFor(t), () => tbl(t).ready)
  return { rows: rows as R[], ready }
}

// ---- writes: applied to the screen at once, then confirmed by the database ----
export interface Result { ok: boolean; message?: string }
const matches = (r: Row, m: Row) => Object.entries(m).every(([k, v]) => r[k] === v)

function applyLocal(t: string, fn: (rows: Map<string, Row>) => void) {
  const T = tbl(t)
  if (!T.ready) return
  fn(T.rows); touch(t)
}
async function settle(t: string, p: PromiseLike<{ error: { message: string } | null }>): Promise<Result> {
  const { error } = await p
  if (error) { load(t); return { ok: false, message: error.message } }
  return { ok: true }
}

export const dbUpsert = (t: string, row: Row): Promise<Result> => {
  applyLocal(t, rows => { const k = keyOf(t, row); rows.set(k, { ...rows.get(k), ...row }) })
  return settle(t, sb.from(t).upsert(row))
}
export const dbInsert = (t: string, list: Row[]): Promise<Result> => {
  applyLocal(t, rows => list.forEach(r => rows.set(keyOf(t, r), r)))
  return settle(t, sb.from(t).insert(list))
}
export const dbUpdate = (t: string, match: Row, patch: Row): Promise<Result> => {
  applyLocal(t, rows => rows.forEach((r, k) => { if (matches(r, match)) rows.set(k, { ...r, ...patch }) }))
  let q = sb.from(t).update(patch)
  for (const [c, v] of Object.entries(match)) q = q.eq(c, v)
  return settle(t, q)
}
export const dbDelete = (t: string, match: Row): Promise<Result> => {
  applyLocal(t, rows => rows.forEach((r, k) => { if (matches(r, match)) rows.delete(k) }))
  let q = sb.from(t).delete()
  for (const [c, v] of Object.entries(match)) q = q.eq(c, v)
  return settle(t, q)
}
