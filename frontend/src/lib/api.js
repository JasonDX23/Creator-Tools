// Replace with your actual Render backend URL once deployed
export const API_BASE = import.meta.env.VITE_API_BASE || 'https://creator-tools-backend.onrender.com'

// QR Generator
export async function fetchQrCodeBlob(url) {
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

// Video converter
export function convertVideo(file, outputFormat, onUploadProgress) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('output_format', outputFormat)

  // XMLHttpRequest exposes upload progress; fetch does not yet do so reliably.
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('POST', `${API_BASE}/api/convert`)
    request.responseType = 'blob'

    request.upload.onprogress = (event) => {
      if (event.lengthComputable && onUploadProgress) {
        onUploadProgress(event.loaded / event.total)
      }
    }

    request.onerror = () => reject(new Error('Network error while converting video'))
    request.onload = async () => {
      if (request.status >= 200 && request.status < 300) {
        resolve(request.response)
        return
      }

      const message = await request.response.text()
        .then((text) => JSON.parse(text).detail)
        .catch(() => '')
      reject(new Error(message || `Conversion failed (${request.status})`))
    }
    request.send(formData)
  })
}
