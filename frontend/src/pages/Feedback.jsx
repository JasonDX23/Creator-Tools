import { useState } from 'react'
import { API_BASE } from '../lib/api'
export default function Feedback({ onBack }) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | success | error

  async function handleSubmit(e) {
    e.preventDefault()
    if (!message.trim()) return

    setStatus('sending')
    try {
      const res = await fetch(`${API_BASE}/api/feedback/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim() || 'New Feature Request',
          message: message.trim(),
        }),
      })

      if (!res.ok) throw new Error('Failed to send feedback')

      setStatus('success')
      setSubject('')
      setMessage('')
    } catch (err) {
      setStatus('error')
    }
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
        <h1 className="font-display text-2xl font-bold">Feedback & Ideas</h1>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="rounded-card border-[3px] border-ink bg-cream p-4 shadow-hard">
          <label className="mb-1 block font-display text-xs font-bold uppercase text-ink/70">
            Topic / Feature Name
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={status === 'sending'}
            placeholder="e.g. Add Auto-Subtitles"
            className="w-full rounded-tile border-[2px] border-ink bg-white p-2.5 font-medium outline-none disabled:opacity-50"
          />

          <label className="mb-1 mt-4 block font-display text-xs font-bold uppercase text-ink/70">
            Details & Ideas
          </label>
          <textarea
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={status === 'sending'}
            placeholder="Describe the feature or idea you'd like to see added..."
            className="w-full resize-none rounded-tile border-[2px] border-ink bg-white p-2.5 font-medium outline-none disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={status === 'sending' || !message.trim()}
            className="press-el mt-4 w-full rounded-tile border-[3px] border-ink bg-mint py-3 font-display font-bold text-ink shadow-hard-sm disabled:opacity-50"
          >
            {status === 'sending' ? 'Sending...' : 'Submit Idea'}
          </button>
        </div>

        {/* Feedback Messages */}
        {status === 'success' && (
          <p className="rounded-tile border-[2px] border-ink bg-mint p-3 text-center text-xs font-bold text-ink shadow-hard-sm">
            ✨ Idea submitted successfully!
          </p>
        )}
        {status === 'error' && (
          <p className="rounded-tile border-[2px] border-ink bg-flame p-3 text-center text-xs font-bold text-ink shadow-hard-sm">
            Could not send feedback. Check backend server and try again.
          </p>
        )}
      </form>
    </div>
  )
}