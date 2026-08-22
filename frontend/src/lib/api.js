// 1. Export API_BASE so Feedback.jsx can import it
export const API_BASE = '' 

// 2. Updated paths to include /api prefix
export async function fetchQrCodeBlob(url) {
  const res = await fetch(
    `${API_BASE}/api/qr/qrcode?url=${encodeURIComponent(url)}`
  )
  if (!res.ok) {
    throw new Error(`QR generation failed (${res.status})`)
  }
  return res.blob()
}

// Captions Generator
export async function fetchCaptions(file) {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_BASE}/api/transcript/captions`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(
      errorData.detail || `Caption generation failed (${res.status})`
    )
  }

  return res.json() // Returns { filename: string, srt: string }
}