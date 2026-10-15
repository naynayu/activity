import { useEffect, useState } from 'react'
import { ME_KEY, SESSION_ID } from './config'
import { dbUpdate, useTable } from './store'
import { sb } from './supabase'
import type { Participant, SessionRow } from './types'

/** The one live session row. Every component can call this; there is one connection underneath. */
export function useSession(): SessionRow | null {
  const { rows } = useTable<SessionRow>('session')
  return rows.find(r => r.id === SESSION_ID) ?? null
}
export const setSession = (patch: Partial<SessionRow>) =>
  dbUpdate('session', { id: SESSION_ID }, { ...patch, updated_at: new Date().toISOString() })

// ---- shared clock ----
let skewMs = 0
/** Phones have wrong clocks. Ask the database for its time a few times, trust the
 *  fastest round trip, and correct every countdown by the difference. */
export async function syncClock() {
  let best: { rtt: number; skew: number } | null = null
  for (let i = 0; i < 5; i++) {
    const t0 = Date.now()
    const { data, error } = await sb.rpc('server_time_ms')
    const t1 = Date.now()
    if (error || typeof data !== 'number') continue
    const rtt = t1 - t0
    if (!best || rtt < best.rtt) best = { rtt, skew: data + rtt / 2 - t1 }
  }
  if (best) skewMs = best.skew
}
export const serverNow = () => Date.now() + skewMs

/** Whole seconds left on the shared clock; null when no timer is running. */
export function useCountdown(endsAt: string | null | undefined): number | null {
  const [, tick] = useState(0)
  useEffect(() => { const id = setInterval(() => tick(n => n + 1), 200); return () => clearInterval(id) }, [])
  if (!endsAt) return null
  return Math.max(0, Math.ceil((new Date(endsAt).getTime() - serverNow()) / 1000))
}
export const clock = (sec: number | null) =>
  sec == null ? '--:--' : `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`

// ---- who am I ----
export function readMe(): Participant | null {
  try { return JSON.parse(localStorage.getItem(ME_KEY) || 'null') } catch { return null }
}
export function writeMe(p: Participant) { try { localStorage.setItem(ME_KEY, JSON.stringify(p)) } catch { /* private mode */ } }
export function forgetMe() { try { localStorage.removeItem(ME_KEY) } catch { /* private mode */ } }

export async function participantStillExists(id: string): Promise<boolean> {
  const { data, error } = await sb.from('participants').select('id').eq('id', id).maybeSingle()
  if (error) return true
  return !!data
}

/** Scanning the QR again brings back the same person, never a second copy. */
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
