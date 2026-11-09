import { ME_KEY, SESSION_ID } from './config'
import { dbUpdate, useTable } from './store'
import { sb } from './supabase'
import type { Participant, SessionRow } from './types'

export function useSession(): SessionRow | null {
  return useTable<SessionRow>('session').rows.find(r => r.id === SESSION_ID) ?? null
}
export const setSession = (patch: Partial<SessionRow>) =>
  dbUpdate('session', { id: SESSION_ID }, { ...patch, updated_at: new Date().toISOString() })

export function readMe(): Participant | null {
  try { return JSON.parse(localStorage.getItem(ME_KEY) || 'null') } catch { return null }
}
export const writeMe = (p: Participant) => { try { localStorage.setItem(ME_KEY, JSON.stringify(p)) } catch { /* private mode */ } }
export const forgetMe = () => { try { localStorage.removeItem(ME_KEY) } catch { /* private mode */ } }

export async function stillExists(id: string): Promise<boolean> {
  const { data, error } = await sb.from('participants').select('id').eq('id', id).maybeSingle()
  return error ? true : !!data
}

/** Joining again with the same name brings back the same person. */
export async function join(name: string): Promise<Participant> {
  const clean = name.trim()
  const pattern = clean.replace(/[\\%_]/g, c => `\\${c}`)
  const { data: existing } = await sb.from('participants').select().ilike('name', pattern).limit(1).maybeSingle()
  if (existing) { writeMe(existing as Participant); return existing as Participant }
  const { data, error } = await sb.from('participants').insert({ name: clean }).select().single()
  if (error) { if (error.code === '23505') return join(clean); throw error }
  writeMe(data as Participant)
  return data as Participant
}
