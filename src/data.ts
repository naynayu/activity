import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { ME_KEY, SESSION_ID, SUPABASE_KEY, SUPABASE_URL } from './config'
import { sb } from './supabase'
import type { Participant, SessionRow } from './types'

type Filter = [column: string, value: string | number]

/** Rows from one table, kept fresh by realtime with a slow poll as a safety net,
 *  so a flaky venue network still catches up within a few seconds. */
export function useRows<T>(table: string, filters: Filter[] = [], pollMs = 6000) {
  const [rows, setRows] = useState<T[]>([])
  const [ready, setReady] = useState(false)
  const latest = useRef(filters)
  latest.current = filters
  const channelId = useId()

  const refetch = useCallback(async () => {
    let q = sb.from(table).select('*')
    for (const [col, val] of latest.current) q = q.eq(col, val as never)
    const { data } = await q.limit(2000)
    if (data) setRows(data as T[])
    setReady(true)
  }, [table])

  const key = JSON.stringify(filters)
  useEffect(() => {
    refetch()
    const ch = sb.channel(`rt-${table}-${channelId}-${key}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => refetch())
      .subscribe()
    const id = setInterval(refetch, pollMs)
    return () => { sb.removeChannel(ch); clearInterval(id) }
  }, [table, key, pollMs, refetch, channelId])

  return { rows, ready, refetch }
}

export function useSession() {
  const [session, setSession] = useState<SessionRow | null>(null)
  const refetch = useCallback(async () => {
    const { data } = await sb.from('session').select('*').eq('id', SESSION_ID).single()
    if (data) setSession(data as SessionRow)
  }, [])
  useEffect(() => {
    refetch()
    const ch = sb.channel('rt-session')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session' }, () => refetch())
      .subscribe()
    const id = setInterval(refetch, 3000)
    return () => { sb.removeChannel(ch); clearInterval(id) }
  }, [refetch])
  return { session, refetch }
}

export async function setSession(patch: Partial<SessionRow>) {
  const { error } = await sb.from('session')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', SESSION_ID)
  if (error) console.error(error)
}

let skewMs = 0
/** A phone with a wrong clock would show the wrong countdown. Measure the
 *  difference against the server once and correct for it. */
export async function measureClockSkew() {
  try {
    const t0 = Date.now()
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, { method: 'HEAD', headers: { apikey: SUPABASE_KEY } })
    const header = res.headers.get('date')
    if (!header) return
    skewMs = new Date(header).getTime() + (Date.now() - t0) / 2 - Date.now()
  } catch { /* keep the local clock */ }
}
export const serverNow = () => Date.now() + skewMs

export function useCountdown(endsAt: string | null | undefined): number | null {
  const [, tick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => tick(n => n + 1), 250)
    return () => clearInterval(id)
  }, [])
  if (!endsAt) return null
  return Math.max(0, Math.ceil((new Date(endsAt).getTime() - serverNow()) / 1000))
}

export const clock = (sec: number | null) =>
  sec == null ? '--:--' : `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`

export function readMe(): Participant | null {
  try { return JSON.parse(localStorage.getItem(ME_KEY) || 'null') } catch { return null }
}
export function writeMe(p: Participant) { try { localStorage.setItem(ME_KEY, JSON.stringify(p)) } catch { /* private mode */ } }
export function forgetMe() { try { localStorage.removeItem(ME_KEY) } catch { /* private mode */ } }

/** After a reset the phone's remembered identity is gone from the database. */
export async function participantStillExists(id: string): Promise<boolean> {
  const { data, error } = await sb.from('participants').select('id').eq('id', id).maybeSingle()
  if (error) return true
  return !!data
}

/** Scanning the QR again must bring back the same person, never a second copy.
 *  Names are matched case-insensitively; a unique index backs this up when two
 *  phones join at once. */
export async function join(name: string): Promise<Participant> {
  const clean = name.trim()
  const pattern = clean.replace(/[\\%_]/g, c => `\\${c}`)
  const { data: existing } = await sb.from('participants').select().ilike('name', pattern).limit(1).maybeSingle()
  if (existing) { writeMe(existing as Participant); return existing as Participant }
  const { data, error } = await sb.from('participants').insert({ name: clean }).select().single()
  if (error) {
    if (error.code === '23505') return join(clean)
    throw error
  }
  writeMe(data as Participant)
  return data as Participant
}
