export const API_BASE = '' 

// QR Generator
export async function fetchQrCodeBlob(url) {
  // Requests /api/qrcode (which Vercel sends to FastAPI as /api/qrcode)
  const res = await fetch(
    `${API_BASE}/api/qrcode?url=${encodeURIComponent(url)}`
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

  // Requests /api/captions
  const res = await fetch(`${API_BASE}/api/captions`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(
      errorData.detail || `Caption generation failed (${res.status})`
    )
  }

  return res.json()
}