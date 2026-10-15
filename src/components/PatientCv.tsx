import { useEffect, useState } from 'react'
import { sb } from '../supabase'

export interface CvRow { round: string; text: string | null; image: string | null }

/** The CV for one patient. It is kept out of the live connection on purpose: only the
 *  projector and host ever read it, so 50 phones never download it. */
export function useCv(round: string, refreshKey: string): CvRow | null {
  const [cv, setCv] = useState<CvRow | null>(null)
  useEffect(() => {
    let live = true
    const get = () => sb.from('cvs').select('*').eq('round', round).maybeSingle().then(({ data }) => { if (live) setCv((data as CvRow) ?? null); return data })
    // Fetched ahead of the reveal so it is already on the phone when the 6 seconds start. One retry for a slow network.
    get().then(d => { if (!d && live) setTimeout(get, 1500) })
    return () => { live = false }
  }, [round, refreshKey])
  return cv
}

export function CvView({ cv }: { cv: CvRow | null }) {
  if (!cv || (!cv.text && !cv.image)) return <div className="card card-lg center muted">No CV added for this patient yet.</div>
  return cv.image ? <img className="cv-img" src={cv.image} alt="The patient's CV" /> : <pre className="cv">{cv.text}</pre>
}

/** Hide emails and phone numbers in pasted text. */
export const maskContacts = (t: string) =>
  t.replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '[email hidden]').replace(/(\+?\d[\d\s().-]{8,}\d)/g, '[phone hidden]')

/** Shrink a photo or screenshot so it is quick to load on the projector. */
export function shrinkImage(file: File, max = 1400): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k)
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      resolve(c.toDataURL('image/jpeg', 0.7))
    }
    img.onerror = () => reject(new Error('Could not read that image'))
    img.src = URL.createObjectURL(file)
  })
}
