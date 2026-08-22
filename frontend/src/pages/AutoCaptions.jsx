import { useState, useEffect } from 'react'
import { fetchCaptions } from '../lib/api'

export default function AutoCaptions({ onBack }) {
  const [file, setFile] = useState(null)
  const [srtText, setSrtText] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | error
  const [errorMsg, setErrorMsg] = useState('')
  const [progress, setProgress] = useState(0)
  const [loadingStep, setLoadingStep] = useState('')

  // Animated progress bar sequence while waiting for backend response
  useEffect(() => {
    let interval
    if (status === 'loading') {
      setProgress(5)
      setLoadingStep('Uploading video...')

      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 30) {
            setLoadingStep('Extracting audio track...')
            return prev + 5
          } else if (prev < 75) {
            setLoadingStep('Running Whisper AI model...')
            return prev + 3
          } else if (prev < 92) {
            setLoadingStep('Formatting SRT timestamps...')
            return prev + 1
          }
          return prev
        })
      }, 400)
    } else {
      setProgress(0)
      setLoadingStep('')
    }
    return () => clearInterval(interval)
  }, [status])

  function handleFileChange(e) {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setSrtText('')
      setStatus('idle')
    }
  }

  async function handleGenerate(e) {
    e.preventDefault()
    if (!file) return
    setStatus('loading')
    setErrorMsg('')

    try {
      const data = await fetchCaptions(file)
      setProgress(100)
      setLoadingStep('Done!')
      
      // Brief pause to let user see 100% completion state
      setTimeout(() => {
        setSrtText(data.srt)
        setStatus('idle')
      }, 300)
    } catch (err) {
      setStatus('error')
      setErrorMsg('Could not process video. Check the file format and try again.')
    }
  }

  function handleDownload() {
    if (!srtText) return
    const blob = new Blob([srtText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = file ? `${file.name.replace(/\.[^/.]+$/, '')}.srt` : 'captions.srt'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-flame/90 px-5 pb-10 pt-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={onBack}
          className="press-el flex h-11 w-11 items-center justify-center rounded-tile border-[3px] border-ink bg-cream shadow-hard-sm"
        >
          ←
        </button>
        <h1 className="font-display text-2xl font-bold">Caption Generator</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleGenerate} className="mb-6">
        <div className="flex items-center gap-2 rounded-card border-[3px] border-ink bg-cream p-2 pl-4 shadow-hard">
          <input
            type="file"
            accept="video/*,audio/*"
            onChange={handleFileChange}
            disabled={status === 'loading'}
            className="min-w-0 flex-1 text-sm font-medium outline-none file:mr-3 file:rounded-tile file:border-[2px] file:border-ink file:bg-mint file:px-3 file:py-1 file:font-display file:font-bold disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status === 'loading' || !file}
            className="press-el shrink-0 rounded-tile border-[3px] border-ink bg-yolk px-4 py-2 font-display font-bold shadow-hard-sm disabled:opacity-50"
          >
            {status === 'loading' ? '...' : 'Go'}
          </button>
        </div>
        {status === 'error' && (
          <p className="mt-2 text-sm font-semibold text-ink">{errorMsg}</p>
        )}
      </form>

      {/* Output / Loading Card */}
      <div className="relative">
        <span className="absolute -top-2 left-8 h-6 w-20 rounded-t-md border-[3px] border-b-0 border-ink bg-mint" />
        <div className="relative flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-card border-[3px] border-ink bg-cream p-6 shadow-hard-lg">
          {status === 'loading' ? (
            <div className="w-full px-2 text-center">
              <div className="mb-2 flex items-center justify-between text-xs font-bold text-ink">
                <span>{loadingStep}</span>
                <span>{progress}%</span>
              </div>
              
              {/* Outer Progress Container */}
              <div className="h-6 w-full overflow-hidden rounded-full border-[3px] border-ink bg-white p-0.5 shadow-hard-sm">
                {/* Inner Filled Bar */}
                <div
                  className="h-full rounded-full border-r-[2px] border-ink bg-yolk transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-3 text-xs font-medium text-ink/60">
                ✨ Transcribing...
              </p>
            </div>
          ) : srtText ? (
            <>
              <textarea
                readOnly
                value={srtText}
                className="h-64 w-full resize-none rounded-tile border-[3px] border-ink bg-white p-3 font-mono text-xs font-semibold leading-relaxed text-ink outline-none"
              />
              <button
                onClick={handleDownload}
                className="press-el rounded-tile border-[3px] border-ink bg-violet px-5 py-2.5 font-display font-bold text-cream shadow-hard-sm"
              >
                Download .SRT
              </button>
            </>
          ) : (
            <p className="px-6 text-center text-sm font-medium text-ink/50">
              Upload a video or audio file and hit Go to generate your captions.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}