import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { useStatus } from './store'

export function StatusDot() {
  const s = useStatus()
  return <span className={`dot dot-${s}`} title={s} />
}

export function Qr({ url, size = 220 }: { url: string; size?: number }) {
  const [src, setSrc] = useState('')
  useEffect(() => { QRCode.toDataURL(url, { width: size, margin: 1 }).then(setSrc) }, [url, size])
  return src ? <img src={src} width={size} height={size} alt="QR code to join" /> : null
}

export const Bar = ({ done, total }: { done: number; total: number }) => (
  <div className="bar" aria-label={`${done} of ${total}`}><div style={{ width: `${total ? (100 * done) / total : 0}%` }} /></div>
)
