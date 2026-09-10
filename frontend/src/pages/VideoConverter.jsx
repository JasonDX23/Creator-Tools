import { useEffect, useState } from 'react'
import { convertVideo } from '../lib/api'

const FORMATS = ['mp4', 'mov', 'mkv', 'webm', 'avi']

export default function VideoConverter({ onBack }) {
  const [file, setFile] = useState(null)
  const [format, setFormat] = useState('mp4')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [downloadUrl, setDownloadUrl] = useState('')

  useEffect(() => () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl)
  }, [downloadUrl])

  function chooseFile(event) {
    const selected = event.target.files[0]
    if (!selected) return
    if (downloadUrl) URL.revokeObjectURL(downloadUrl)
    setFile(selected)
    setDownloadUrl('')
    setError('')
    setStatus('idle')
  }

  async function handleConvert(event) {
    event.preventDefault()
    if (!file) return
    setStatus('loading')
    setError('')
    if (downloadUrl) URL.revokeObjectURL(downloadUrl)
    setDownloadUrl('')

    try {
      const blob = await convertVideo(file, format)
      setDownloadUrl(URL.createObjectURL(blob))
      setStatus('done')
    } catch (err) {
      setStatus('error')
      setError(err.message || 'Could not convert this video. Please try another file.')
    }
  }

  const downloadName = file
    ? `${file.name.replace(/\.[^/.]+$/, '')}.${format}`
    : `converted-video.${format}`

  return (
    <div className="mx-auto min-h-screen max-w-md bg-mint/90 px-5 pb-10 pt-6">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={onBack} className="press-el flex h-11 w-11 items-center justify-center rounded-tile border-[3px] border-ink bg-cream shadow-hard-sm">←</button>
        <h1 className="font-display text-2xl font-bold">Video Converter</h1>
      </div>

      <form onSubmit={handleConvert} className="space-y-4">
        <label className="block rounded-card border-[3px] border-ink bg-cream p-4 shadow-hard">
          <span className="mb-2 block font-display font-bold">Choose a video</span>
          <input
            type="file"
            accept="video/*,.m4v,.flv,.wmv,.mpeg,.mpg,.3gp,.ts,.mts"
            onChange={chooseFile}
            disabled={status === 'loading'}
            className="w-full text-sm file:mr-3 file:rounded-tile file:border-[2px] file:border-ink file:bg-yolk file:px-3 file:py-1 file:font-display file:font-bold"
          />
          {file && <span className="mt-2 block truncate text-sm font-medium text-ink/65">{file.name}</span>}
        </label>

        <label className="block rounded-card border-[3px] border-ink bg-cream p-4 shadow-hard">
          <span className="mb-2 block font-display font-bold">Convert to</span>
          <select value={format} onChange={(event) => setFormat(event.target.value)} disabled={status === 'loading'} className="w-full rounded-tile border-[3px] border-ink bg-white px-3 py-2 font-medium outline-none">
            {FORMATS.map((item) => <option key={item} value={item}>.{item.toUpperCase()}</option>)}
          </select>
        </label>

        <button type="submit" disabled={!file || status === 'loading'} className="press-el w-full rounded-tile border-[3px] border-ink bg-violet px-5 py-3 font-display font-bold text-cream shadow-hard disabled:opacity-50">
          {status === 'loading' ? 'Converting…' : 'Convert video'}
        </button>
      </form>

      {error && <p className="mt-4 rounded-tile border-[3px] border-ink bg-cream p-3 text-sm font-semibold">{error}</p>}

      <div className="relative mt-8">
        <span className="absolute -top-2 left-8 h-6 w-20 rounded-t-md border-[3px] border-b-0 border-ink bg-yolk" />
        <div className="relative flex min-h-44 flex-col items-center justify-center gap-3 rounded-card border-[3px] border-ink bg-cream p-6 shadow-hard-lg">
          {status === 'loading' ? <p className="text-center font-medium">Converting your video. This can take a moment…</p> : downloadUrl ? <>
            <p className="text-center font-medium">Your .{format} video is ready.</p>
            <a href={downloadUrl} download={downloadName} className="press-el rounded-tile border-[3px] border-ink bg-yolk px-5 py-2.5 font-display font-bold shadow-hard-sm">Download video</a>
          </> : <p className="text-center text-sm font-medium text-ink/50">Pick a video and its new format to get started.</p>}
        </div>
      </div>
    </div>
  )
}
