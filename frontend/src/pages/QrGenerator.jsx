import { useState } from 'react'
import { fetchQrCodeBlob } from '../lib/api'

export default function QrGenerator({ onBack }) {
  const [url, setUrl] = useState('')
  const [imgUrl, setImgUrl] = useState(null)
  const [status, setStatus] = useState('idle') // idle | loading | error
  const [errorMsg, setErrorMsg] = useState('')

  async function handleGenerate(e) {
    e.preventDefault()
    if (!url.trim()) return
    setStatus('loading')
    setErrorMsg('')
    try {
      const blob = await fetchQrCodeBlob(url.trim())
      if (imgUrl) URL.revokeObjectURL(imgUrl)
      setImgUrl(URL.createObjectURL(blob))
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setErrorMsg('Could not generate that code. Check the link and try again.')
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-flame/90 px-5 pb-10 pt-6">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={onBack}
          className="press-el flex h-11 w-11 items-center justify-center rounded-tile border-[3px] border-ink bg-cream shadow-hard-sm"
        >
          ←
        </button>
        <h1 className="font-display text-2xl font-bold">QR Code Generator</h1>
      </div>

      <form onSubmit={handleGenerate} className="mb-6">
        <div className="flex items-center gap-2 rounded-card border-[3px] border-ink bg-cream p-2 pl-4 shadow-hard">
          <span className="font-display text-lg font-bold">#</span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste your link here"
            inputMode="url"
            className="min-w-0 flex-1 bg-transparent py-2 text-base font-medium outline-none placeholder:text-ink/40"
          />
          <button
            type="submit"
            disabled={status === 'loading' || !url.trim()}
            className="press-el shrink-0 rounded-tile border-[3px] border-ink bg-yolk px-4 py-2 font-display font-bold shadow-hard-sm disabled:opacity-50"
          >
            {status === 'loading' ? '...' : 'Go'}
          </button>
        </div>
        {status === 'error' && (
          <p className="mt-2 text-sm font-semibold text-ink">{errorMsg}</p>
        )}
      </form>

      <div className="relative">
        <span className="absolute -top-2 left-8 h-6 w-20 rounded-t-md border-[3px] border-b-0 border-ink bg-mint" />
        <div className="relative flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-card border-[3px] border-ink bg-cream p-6 shadow-hard-lg">
          {imgUrl ? (
            <img
              src={imgUrl}
              alt="Generated QR code"
              className="h-56 w-56 rounded-tile border-[3px] border-ink bg-white p-3"
            />
          ) : (
            <p className="px-6 text-center text-sm font-medium text-ink/50">
              Your QR code shows up here the moment you hit Go.
            </p>
          )}

          {imgUrl && (
            <a
              href={imgUrl}
              download="qrcode.png"
              className="press-el rounded-tile border-[3px] border-ink bg-violet px-5 py-2.5 font-display font-bold text-cream shadow-hard-sm"
            >
              Download PNG
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
