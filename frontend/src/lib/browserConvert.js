import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import coreURL from '@ffmpeg/core?url'
import wasmURL from '@ffmpeg/core/wasm?url'

const ffmpeg = new FFmpeg()
let loadPromise
let progressListener

const MIME_TYPES = {
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  mkv: 'video/x-matroska',
  webm: 'video/webm',
  avi: 'video/x-msvideo',
}

async function loadFfmpeg() {
  if (!loadPromise) {
    loadPromise = ffmpeg.load({ coreURL, wasmURL }).catch((error) => {
      loadPromise = undefined
      throw error
    })
  }
  return loadPromise
}

function extensionOf(name) {
  const match = /\.[^.]+$/.exec(name)
  return match ? match[0].toLowerCase() : '.mp4'
}

function codecArguments(format) {
  const streams = ['-map', '0:v:0', '-map', '0:a:0?', '-pix_fmt', 'yuv420p']
  if (format === 'webm') {
    return [...streams, '-c:v', 'libvpx-vp9', '-crf', '32', '-b:v', '0', '-c:a', 'libopus']
  }
  return [...streams, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-c:a', 'aac']
}

// Runs entirely on the visitor's device. Source dimensions are not changed.
export async function convertInBrowser(file, format, onProgress) {
  await loadFfmpeg()

  const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  const inputName = `input-${id}${extensionOf(file.name)}`
  const outputName = `output-${id}.${format}`
  progressListener = ({ progress }) => onProgress?.(Math.round(Math.max(0, Math.min(1, progress)) * 100))
  ffmpeg.on('progress', progressListener)

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file))
    const args = ['-hide_banner', '-nostdin', '-y', '-i', inputName, ...codecArguments(format)]
    if (format === 'mp4' || format === 'mov') args.push('-movflags', '+faststart')
    args.push(outputName)

    const exitCode = await ffmpeg.exec(args)
    if (exitCode !== 0) throw new Error('This video could not be converted in this browser.')
    const data = await ffmpeg.readFile(outputName)
    return new Blob([data], { type: MIME_TYPES[format] })
  } finally {
    ffmpeg.off('progress', progressListener)
    await Promise.allSettled([ffmpeg.deleteFile(inputName), ffmpeg.deleteFile(outputName)])
  }
}
